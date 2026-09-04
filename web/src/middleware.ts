import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { verifyAdminSession } from './lib/admin-auth'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
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

export const config = {
  matcher: [
    // admin, api, _next/static, _next/image, favicon.ico 제외한 모든 경로
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
