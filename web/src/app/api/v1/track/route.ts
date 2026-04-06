import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const VISITOR_COOKIE = 'visitor_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1년

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { path, referrer } = body as { path?: string; referrer?: string }

    // visitor_id 쿠키 읽기
    const cookieStore = await cookies()
    let visitorId = cookieStore.get(VISITOR_COOKIE)?.value

    const isNew = !visitorId
    if (!visitorId) {
      visitorId = randomUUID()
    }

    // page_views 저장
    await prisma.pageView.create({
      data: {
        path: path ?? '/',
        referrer: referrer ?? null,
        visitorId,
      },
    })

    const response = NextResponse.json({ ok: true, visitorId })

    // 신규 방문자라면 쿠키 설정
    if (isNew) {
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    }

    return response
  } catch (err) {
    // 추적 실패는 silent — 사용자 경험에 영향 없도록
    console.error('[Track API]', err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
