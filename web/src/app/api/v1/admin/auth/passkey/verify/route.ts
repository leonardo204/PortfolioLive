/**
 * 패스키 로그인 2단계 — 기기 서명을 확인하고 관리자 세션을 내준다.
 *
 * 확인에 성공하면 비밀번호 로그인과 똑같은 admin-session 쿠키를 발급한다.
 * 그래서 이후 화면과 API는 어느 쪽으로 들어왔는지 신경 쓰지 않아도 된다.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { signAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import {
  CHALLENGE_COOKIE,
  clearedChallengeCookieAttrs,
  getRpConfig,
  isSecureRequest,
  takeChallenge,
} from '@/lib/passkey'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { clientIpOf, clearLoginFailures } from '@/lib/admin-ip-block'

const SESSION_TTL_SECONDS = 60 * 60 * 24

export async function POST(request: NextRequest) {
  const secure = isSecureRequest(request)

  const finish = (body: unknown, status: number) => {
    const res = NextResponse.json(body, { status })
    res.cookies.set(CHALLENGE_COOKIE, '', clearedChallengeCookieAttrs(secure))
    return res
  }

  const ip = getClientIp(request.headers)
  const limit = await checkRateLimit(ip, 'admin_passkey_login', {
    windowSeconds: 60,
    maxRequests: 20,
  })
  if (!limit.allowed) {
    return finish({ error: '시도가 너무 잦습니다. 잠시 후 다시 해 주세요.' }, 429)
  }

  try {
    const credentialResponse = await request.json()

    const expectedChallenge = await takeChallenge(request, 'login')
    if (!expectedChallenge) {
      return finish({ error: '로그인 시간이 지났습니다. 다시 시도해 주세요.' }, 400)
    }

    const credentialId = typeof credentialResponse?.id === 'string' ? credentialResponse.id : ''
    if (!credentialId) {
      return finish({ error: '올바르지 않은 요청입니다.' }, 400)
    }

    const stored = await prisma.adminCredential.findUnique({ where: { id: credentialId } })
    if (!stored) {
      return finish({ error: '등록되지 않은 기기입니다.' }, 401)
    }

    const { rpID, origins } = getRpConfig()

    const verification = await verifyAuthenticationResponse({
      response: credentialResponse,
      expectedChallenge,
      expectedOrigin: origins,
      expectedRPID: rpID,
      credential: {
        id: stored.id,
        publicKey: new Uint8Array(stored.publicKey),
        counter: Number(stored.counter),
        transports: stored.transports,
      },
      requireUserVerification: true,
    })

    if (!verification.verified) {
      return finish({ error: '기기 확인에 실패했습니다.' }, 401)
    }

    // 서명 횟수를 갱신한다. 값이 되돌아가면 복제된 기기이므로 위 검증에서 이미 걸린다.
    await prisma.adminCredential.update({
      where: { id: stored.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    })

    // 패스키로 본인이 확인됐으니 이 주소에 쌓인 비밀번호 실패 횟수를 지운다.
    // 이미 막힌 주소는 그대로 둔다 — 차단은 관리 화면에서만 푼다.
    await clearLoginFailures(clientIpOf(request))

    const sessionToken = await signAdminSession(SESSION_TTL_SECONDS)

    const response = finish({ success: true }, 200)
    response.cookies.set('admin-session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS,
      path: '/',
      secure,
    })
    return response
  } catch (e) {
    console.error('[passkey] 로그인 확인 실패:', e)
    return finish({ error: '로그인에 실패했습니다.' }, 500)
  }
}
