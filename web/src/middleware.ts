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
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // admin, api, _next/static, _next/image, favicon.ico 제외한 모든 경로
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
