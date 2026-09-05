/**
 * 패스키(WebAuthn) 로그인 공통 부분.
 *
 * 패스키는 기기 안에 개인키를 두고, 지문·얼굴·기기 잠금으로 그 키를 열어 서명한다.
 * 서버에는 공개키만 남으므로 데이터베이스가 통째로 새어도 남의 로그인에 쓰이지 않는다.
 *
 * 어느 도메인의 패스키인지(rpID)와 어떤 주소에서 온 요청을 받아줄지(origin)는
 * 요청 헤더가 아니라 설정에서 읽는다. 헤더를 믿으면 남의 도메인에서 만든 패스키를
 * 받아줄 수 있다.
 */

import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { SITE_URL } from './site'

/** 도전값을 담아 둘 쿠키. 브라우저와 서버가 같은 로그인 시도를 가리키게 한다. */
export const CHALLENGE_COOKIE = 'admin-passkey-challenge'

/** 도전값이 살아 있는 시간. 짧게 둬야 가로챈 값을 나중에 못 쓴다. */
export const CHALLENGE_TTL_SECONDS = 300

export type ChallengePurpose = 'register' | 'login'

export interface RpConfig {
  rpID: string
  rpName: string
  origins: string[]
}

/**
 * 어느 도메인의 패스키인지 정한다.
 * 기본값은 공개 주소에서 뽑고, 다른 도메인에 올릴 때는 환경변수로 덮어쓴다.
 */
export function getRpConfig(): RpConfig {
  const siteHost = new URL(SITE_URL).hostname

  const rpID = process.env.PASSKEY_RP_ID?.trim() || siteHost
  const rpName = process.env.PASSKEY_RP_NAME?.trim() || 'Leonardo204 Admin'

  const configured = process.env.PASSKEY_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  const origins = configured?.length ? configured : [SITE_URL]

  return { rpID, rpName, origins }
}

/** 브라우저에 담아 보낼 쿠키 설정. https가 아니면 secure를 빼야 개발 중에도 붙는다. */
function cookieOptions(secure: boolean) {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: CHALLENGE_TTL_SECONDS,
    secure,
  }
}

export function isSecureRequest(request: NextRequest): boolean {
  if (request.nextUrl.protocol === 'https:') return true
  if (request.headers.get('x-forwarded-proto') === 'https') return true
  return false
}

function randomId(): string {
  const bytes = new Uint8Array(18)
  globalThis.crypto.getRandomValues(bytes)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function storeKey(purpose: ChallengePurpose, id: string): string {
  return `pk:${purpose}:${id}`
}

/**
 * 도전값을 저장하고, 그 자리를 가리키는 쿠키 값을 돌려준다.
 * 값 자체는 데이터베이스에 두고 쿠키에는 열쇠만 담아, 브라우저가 값을 바꿔치기하지 못하게 한다.
 */
export async function saveChallenge(
  purpose: ChallengePurpose,
  challenge: string
): Promise<{ cookieName: string; cookieValue: string }> {
  const id = randomId()
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000)

  await prisma.cacheStore.upsert({
    where: { key: storeKey(purpose, id) },
    create: { key: storeKey(purpose, id), value: { challenge }, expiresAt },
    update: { value: { challenge }, expiresAt },
  })

  // 도중에 그만둔 시도는 행이 그대로 남는다. 새로 만들 때 지난 것들을 함께 치운다.
  await prisma.cacheStore
    .deleteMany({ where: { key: { startsWith: 'pk:' }, expiresAt: { lt: new Date() } } })
    .catch(() => undefined)

  return { cookieName: CHALLENGE_COOKIE, cookieValue: `${purpose}.${id}` }
}

/**
 * 도전값을 꺼내면서 곧바로 지운다. 한 번 쓴 값을 다시 못 쓰게 하는 것이 핵심이다.
 * 쿠키가 없거나, 용도가 다르거나, 시간이 지났으면 null을 준다.
 */
export async function takeChallenge(
  request: NextRequest,
  purpose: ChallengePurpose
): Promise<string | null> {
  const raw = request.cookies.get(CHALLENGE_COOKIE)?.value
  if (!raw) return null

  const sep = raw.indexOf('.')
  if (sep < 0) return null

  const kind = raw.slice(0, sep)
  const id = raw.slice(sep + 1)
  if (kind !== purpose || !id) return null

  const key = storeKey(purpose, id)

  try {
    const row = await prisma.cacheStore.findUnique({ where: { key } })
    if (!row) return null

    // 꺼낸 즉시 지운다. 이후에 같은 값으로 다시 시도해도 통하지 않는다.
    await prisma.cacheStore.delete({ where: { key } }).catch(() => undefined)

    if (row.expiresAt && row.expiresAt < new Date()) return null

    const value = row.value as { challenge?: unknown } | null
    return typeof value?.challenge === 'string' ? value.challenge : null
  } catch {
    return null
  }
}

/** 도전값 쿠키를 만들 때 쓰는 설정 */
export function challengeCookieAttrs(secure: boolean) {
  return cookieOptions(secure)
}

/** 도전값 쿠키를 지울 때 쓰는 설정 */
export function clearedChallengeCookieAttrs(secure: boolean) {
  return { ...cookieOptions(secure), maxAge: 0 }
}

/** 화면에 보여줄 패스키 목록. 공개키와 서명 횟수는 내보내지 않는다. */
export async function listCredentials() {
  const rows = await prisma.adminCredential.findMany({
    orderBy: [{ createdAt: 'asc' }],
    select: {
      id: true,
      label: true,
      deviceType: true,
      backedUp: true,
      transports: true,
      createdAt: true,
      lastUsedAt: true,
    },
  })
  return rows
}

/** 관리 화면에서 쓰는 인증 정보 개수 */
export async function countCredentials(): Promise<number> {
  try {
    return await prisma.adminCredential.count()
  } catch {
    return 0
  }
}

/** 등록 요청이 보낸 이름을 다듬는다. 비어 있으면 기본 이름을 준다. */
export function normalizeLabel(input: unknown): string {
  if (typeof input !== 'string') return '이름 없는 기기'
  const trimmed = input.trim().replace(/\s+/g, ' ')
  if (!trimmed) return '이름 없는 기기'
  return trimmed.slice(0, 60)
}

/**
 * 로그인 화면에서 쓸 안내용 사용자 정보.
 * 관리자 한 사람만 쓰는 화면이라 고정값을 쓴다.
 */
export const ADMIN_USER = {
  /** 기기 목록에 표시되는 계정 이름 */
  name: 'admin@me.zerolive.co.kr',
  displayName: 'Leonardo204 Admin',
  /** 패스키를 묶는 사용자 식별자. 바뀌면 기존 패스키와 연결이 끊긴다. */
  id: new TextEncoder().encode('portfoliolive-admin'),
} as const
