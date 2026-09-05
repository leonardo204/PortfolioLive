import { NextRequest, NextResponse } from 'next/server'
import { signAdminSession } from '@/lib/admin-auth'
import {
  clientIpOf,
  isIpBlocked,
  recordLoginFailure,
  clearLoginFailures,
} from '@/lib/admin-ip-block'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

function isSecureRequest(request: NextRequest): boolean {
  if (request.nextUrl.protocol === 'https:') return true
  if (request.headers.get('x-forwarded-proto') === 'https') return true
  return false
}

const BLOCKED_MESSAGE =
  '비밀번호를 여러 번 잘못 입력해 이 주소에서의 로그인이 차단되었습니다. 등록해 둔 패스키로 로그인하세요.'

export async function POST(request: NextRequest) {
  try {
    const ip = clientIpOf(request)

    // 막힌 주소면 비밀번호를 맞혀도 들여보내지 않는다.
    // 패스키 로그인은 별도 경로라 여기에 걸리지 않는다.
    if (await isIpBlocked(ip)) {
      return NextResponse.json({ error: BLOCKED_MESSAGE, blocked: true }, { status: 403 })
    }

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
      const { blocked, remaining } = await recordLoginFailure(
        ip,
        request.headers.get('user-agent')
      )

      if (blocked) {
        return NextResponse.json({ error: BLOCKED_MESSAGE, blocked: true }, { status: 403 })
      }

      return NextResponse.json(
        {
          error: `비밀번호가 올바르지 않습니다. ${remaining}번 더 틀리면 이 주소에서의 로그인이 차단됩니다.`,
          remaining,
        },
        { status: 401 }
      )
    }

    await clearLoginFailures(ip)
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
