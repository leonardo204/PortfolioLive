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

  // 루트는 늘 기본 언어(/ko)로 간다. next-intl 이 내주는 307(임시)을 308(영구)로 바꾼다.
  //
  // 307 은 "이번에는 여기로"라는 뜻이라, 검색 엔진이 / 를 색인 대상에서 빼면서도
  // 계속 다시 확인한다(실제로 Googlebot 이 / 를 여섯 번 다시 받아 갔다).
  // 308 이면 한 번 보고 /ko 로 신호를 몰아 준다.
  //
  // 언어에 따라 갈라 보내지 않는다. 지금도 Accept-Language 와 상관없이 늘 /ko 로 가고
  // (전송망이 Vary 없이 보관한다), 그 상태에서 응답만 영구로 바꾸면 말과 행동이 맞는다.
  // 영어로 오는 길은 hreflang 과 사이트맵의 /en 이 따로 알려 준다.
  if (pathname === '/') {
    const to = request.nextUrl.clone()
    to.pathname = '/ko'
    return NextResponse.redirect(to, 308)
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
 * 상태 코드를 정하는 순서. 주소 판단이 먼저다.
 *  1) 이 앱에 없는 주소면 404로 적는다. next-intl이 언어 경로를 붙이려고 /ko/... 로
 *     되돌려 보내기 때문에 없는 주소도 307로 끝나는데, 스캐너는 그걸 따라가지 않는다.
 *     리디렉션 코드를 그대로 쓰면 없는 주소 요청이 통계에서 통째로 빠진다.
 *  2) 있는 주소인데 미들웨어가 되돌려 보냈으면(예: / → /ko) 그 코드를 쓴다.
 *  3) 그 밖에는 200으로 적고, 있는 줄 알았는데 없는 경우(없는 글 주소 등)는
 *     404 화면이 그려질 때 고쳐 보낸다.
 */
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const startedAt = Date.now()
  const result = await handle(request)
  const code = result?.status ?? 200
  const redirected = code >= 300 && code < 400
  const status = looksMissing(request.nextUrl.pathname) ? 404 : redirected ? code : 200
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
