import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

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

    // 세션 토큰 생성 (단순 base64 인코딩)
    const sessionToken = Buffer.from(`admin:${Date.now()}`).toString('base64')

    const response = NextResponse.json({ success: true })
    response.cookies.set('admin-session', sessionToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24시간
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('admin-session', '', {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
  return response
}
