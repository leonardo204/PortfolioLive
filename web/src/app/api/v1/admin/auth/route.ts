import { NextRequest, NextResponse } from 'next/server'
import { signAdminSession } from '@/lib/admin-auth'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

function isSecureRequest(request: NextRequest): boolean {
  if (request.nextUrl.protocol === 'https:') return true
  if (request.headers.get('x-forwarded-proto') === 'https') return true
  return false
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호를 입력하세요.' },
        { status: 400 }
      )
    }

    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      )
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    const sessionToken = await signAdminSession()

    const response = NextResponse.json({ success: true })
    response.cookies.set('admin-session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
      secure: isSecureRequest(request),
    })

    return response
  } catch {
    return NextResponse.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.set('admin-session', '', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    secure: isSecureRequest(request),
  })
  return response
}
