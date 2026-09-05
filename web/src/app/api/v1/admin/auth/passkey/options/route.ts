/**
 * 패스키 로그인 1단계 — 기기에 건넬 요청서를 만든다.
 *
 * 로그인 전이라 누구나 부를 수 있다. 여기서 나가는 값은 무작위 도전값뿐이고
 * 어떤 패스키가 등록돼 있는지는 알려주지 않는다(allowCredentials를 비워 둔다).
 * 그래야 이 화면을 긁어도 등록 기기 목록이 새지 않는다.
 */
import { NextRequest, NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import {
  challengeCookieAttrs,
  getRpConfig,
  isSecureRequest,
  saveChallenge,
} from '@/lib/passkey'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const limit = await checkRateLimit(ip, 'admin_passkey_login', {
    windowSeconds: 60,
    maxRequests: 20,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: '시도가 너무 잦습니다. 잠시 후 다시 해 주세요.' },
      { status: 429 }
    )
  }

  try {
    const { rpID } = getRpConfig()

    const options = await generateAuthenticationOptions({
      rpID,
      // 비밀번호 없이 이것만으로 들어오므로 지문·얼굴·잠금 해제를 반드시 거치게 한다.
      userVerification: 'required',
    })

    const { cookieName, cookieValue } = await saveChallenge('login', options.challenge)

    const response = NextResponse.json(options)
    response.cookies.set(cookieName, cookieValue, challengeCookieAttrs(isSecureRequest(request)))
    return response
  } catch (e) {
    console.error('[passkey] 로그인 요청서 생성 실패:', e)
    return NextResponse.json({ error: '패스키 로그인을 시작하지 못했습니다.' }, { status: 500 })
  }
}
