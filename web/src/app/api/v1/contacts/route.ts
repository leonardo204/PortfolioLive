import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendContactNotification } from '@/lib/mailer'

// Rate limiting: IP당 5분에 1회
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_MS = 5 * 60 * 1000 // 5분

// 만료 엔트리 정리 (요청 시 lazy cleanup, 최대 100개씩)
function cleanupRateLimit() {
  const now = Date.now()
  let cleaned = 0
  for (const [key, ts] of rateLimitMap) {
    if (now - ts >= RATE_LIMIT_MS) {
      rateLimitMap.delete(key)
      if (++cleaned >= 100) break
    }
  }
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  cleanupRateLimit()

  // Rate limit 체크
  const lastRequest = rateLimitMap.get(ip)
  const now = Date.now()
  if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
    const retryAfter = Math.ceil((RATE_LIMIT_MS - (now - lastRequest)) / 1000)
    return NextResponse.json(
      { error: '잠시 후 다시 시도해주세요.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  const { name, email, message, organization, sessionId } = body as {
    name?: unknown
    email?: unknown
    message?: unknown
    organization?: unknown
    sessionId?: unknown
  }

  // 필수값 검증
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
  }
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 })
  }
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 })
  }

  // 길이 제한
  if (name.trim().length > 100) {
    return NextResponse.json({ error: '이름은 100자 이하로 입력해주세요.' }, { status: 400 })
  }
  if (
    organization &&
    typeof organization === 'string' &&
    organization.trim().length > 200
  ) {
    return NextResponse.json({ error: '소속은 200자 이하로 입력해주세요.' }, { status: 400 })
  }
  if (email.trim().length > 254) {
    return NextResponse.json({ error: '이메일 주소가 너무 깁니다.' }, { status: 400 })
  }
  if (message.trim().length > 2000) {
    return NextResponse.json({ error: '메시지는 2000자 이하로 입력해주세요.' }, { status: 400 })
  }

  // 이메일 형식 검증
  if (!EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: '올바른 이메일 형식을 입력해주세요.' }, { status: 400 })
  }

  // Rate limit 갱신 (검증 통과 후)
  rateLimitMap.set(ip, now)

  const normalized = {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    organization:
      organization && typeof organization === 'string'
        ? organization.trim() || null
        : null,
    ipAddress: ip === 'unknown' ? null : ip,
    sessionId: typeof sessionId === 'number' ? sessionId : null,
  }

  try {
    await prisma.contactRequest.create({ data: normalized })
  } catch (err) {
    console.error('[Contacts API] DB 저장 실패', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }

  // 관리자 알림 메일 발송 — 실패해도 사용자 응답은 성공으로 처리 (DB엔 저장됨)
  try {
    const sent = await sendContactNotification(normalized)
    if (!sent) {
      console.warn('[Contacts API] 메일 발송 건너뜀/실패 — DB에만 저장됨')
    }
  } catch (err) {
    console.error('[Contacts API] 메일 발송 중 예외', err)
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
