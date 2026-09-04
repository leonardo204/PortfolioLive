import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { verifyAdminSession } from './lib/admin-auth'
import { looksMissing, sendHit } from './lib/hit'

const intlMiddleware = createMiddleware(routing)

async function handle(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /admin 경로는 next-intl 밖에서 직접 처리
  if (pathname.startsWith('/admin')) {
    // /admin/login은 보호하지 않음
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // 쿠키에서 세션 토큰 읽기 + HMAC 서명 검증
    const token = request.cookies.get('admin-session')?.value
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    const payload = await verifyAdminSession(token)
    if (!payload) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  // 검색엔진·크롤러가 읽는 파일은 언어 경로를 붙이면 안 된다.
  // next-intl이 가로채면 /ko/robots.txt로 넘어가 404가 난다.
  const CRAWLER_FILES = [
    '/robots.txt',
    '/sitemap.xml',
    '/opengraph-image',
    '/twitter-image',
    '/icon',
    '/apple-icon',
    '/favicon.ico',
  ]
  if (CRAWLER_FILES.some((f) => pathname === f || pathname.startsWith(f + '/'))) {
    return NextResponse.next()
  }

  // /api, /poc, /_next, /images 등은 next-intl 제외
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/poc') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next()
  }

  // 나머지는 next-intl 미들웨어
  const response = intlMiddleware(request)

  // 공개 화면은 누구에게나 같은 내용이라 콘텐츠 전송망이 보관해도 된다.
  // s-maxage는 전송망에만 적용되고 방문자 브라우저는 매번 새로 받는다.
  // 한 시간이 지나도 하루 동안은 보관본을 먼저 보여주고 뒤에서 새로 받아 둔다.
  if (request.method === 'GET') {
    response.headers.set(
      'Cache-Control',
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    )
  }

  return response
}

/**
 * 바깥 껍데기 — 실제 처리를 끝낸 뒤에 방문 기록을 보낸다.
 *
 * 상태 코드를 정하는 순서.
 *  1) 미들웨어가 스스로 만든 응답(리디렉션 3xx)이면 그 코드를 그대로 쓴다.
 *  2) 그냥 통과시킨 요청은 여기서 최종 코드를 알 수 없다. 그래서 주소로 판단한다 —
 *     이 앱에 없는 주소면 404, 있는 주소면 200으로 적는다.
 *  3) 있는 줄 알았는데 없는 경우(없는 글 주소 등)는 404 화면이 그려질 때 고쳐 보낸다.
 *
 * 예전에는 `result?.status ?? ...`로 적었는데, 통과 응답도 status가 200이라
 * 뒤쪽 판단이 한 번도 실행되지 않았다. 자동 스캐너 요청이 전부 200으로 남던 원인이다.
 */
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const startedAt = Date.now()
  const result = await handle(request)
  const code = result?.status ?? 200
  const redirected = code >= 300 && code < 400
  const status = redirected ? code : looksMissing(request.nextUrl.pathname) ? 404 : 200
  const hit = sendHit(request, status, Date.now() - startedAt)
  if (hit) event.waitUntil(hit)
  return result
}

export const config = {
  matcher: [
    // admin, api, _next/static, _next/image, favicon.ico 제외한 모든 경로
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
