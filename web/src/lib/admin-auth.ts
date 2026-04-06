/**
 * Admin 인증 헬퍼
 * API 라우트에서 admin 세션 쿠키를 검증합니다.
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * 관리자 인증 검사
 * 인증 실패 시 401 응답을 반환합니다.
 * 성공 시 null을 반환합니다.
 */
export async function requireAdminAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin-session')?.value

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 세션 토큰 유효성 확인 (base64 형식: admin:<timestamp>)
  try {
    const decoded = Buffer.from(session, 'base64').toString('utf-8')
    if (!decoded.startsWith('admin:')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
