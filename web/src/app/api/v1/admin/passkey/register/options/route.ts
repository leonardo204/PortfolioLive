/**
 * 패스키 등록 1단계 — 기기에 건넬 요청서를 만든다.
 *
 * 이미 로그인한 상태에서만 부를 수 있다. 그래야 남이 자기 기기를 몰래 붙이지 못한다.
 */
import { NextRequest, NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import {
  ADMIN_USER,
  challengeCookieAttrs,
  getRpConfig,
  isSecureRequest,
  saveChallenge,
} from '@/lib/passkey'

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  try {
    const { rpID, rpName } = getRpConfig()

    // 이미 등록한 기기는 목록에 넣어 보낸다. 같은 기기를 두 번 등록하지 않게 브라우저가 막아준다.
    const existing = await prisma.adminCredential.findMany({
      select: { id: true, transports: true },
    })

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: ADMIN_USER.name,
      userID: ADMIN_USER.id,
      userDisplayName: ADMIN_USER.displayName,
      attestationType: 'none',
      excludeCredentials: existing.map((c) => ({
        id: c.id,
        transports: c.transports,
      })),
      authenticatorSelection: {
        // 기기 안에 자격 증명을 남겨야 아이디 없이 로그인할 수 있다.
        residentKey: 'required',
        // 지문·얼굴·잠금 해제를 반드시 거치게 한다. 비밀번호 없이 이것만으로 들어오기 때문이다.
        userVerification: 'required',
      },
    })

    const { cookieName, cookieValue } = await saveChallenge('register', options.challenge)

    const response = NextResponse.json(options)
    response.cookies.set(cookieName, cookieValue, challengeCookieAttrs(isSecureRequest(request)))
    return response
  } catch (e) {
    console.error('[passkey] 등록 요청서 생성 실패:', e)
    return NextResponse.json({ error: '패스키 등록을 시작하지 못했습니다.' }, { status: 500 })
  }
}
