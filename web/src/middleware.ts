import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /admin/login은 보호하지 않음
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // /admin/* 경로 보호
  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('admin-session')

    if (!session?.value) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
