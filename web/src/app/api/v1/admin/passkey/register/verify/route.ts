/**
 * 패스키 등록 2단계 — 기기가 만들어 준 답을 확인하고 공개키를 저장한다.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import {
  CHALLENGE_COOKIE,
  clearedChallengeCookieAttrs,
  getRpConfig,
  isSecureRequest,
  normalizeLabel,
  takeChallenge,
} from '@/lib/passkey'

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  const secure = isSecureRequest(request)

  // 성공이든 실패든 이번 도전값은 여기서 끝난다. 응답마다 쿠키를 지운다.
  const finish = (body: unknown, status: number) => {
    const res = NextResponse.json(body, { status })
    res.cookies.set(CHALLENGE_COOKIE, '', clearedChallengeCookieAttrs(secure))
    return res
  }

  try {
    const body = await request.json()
    const label = normalizeLabel(body?.label)

    // 기기가 준 답이 없으면 아래 검증이 알 수 없는 오류를 내므로 여기서 걸러낸다.
    if (!body?.credential || typeof body.credential !== 'object') {
      return finish({ error: '올바르지 않은 요청입니다.' }, 400)
    }

    const expectedChallenge = await takeChallenge(request, 'register')
    if (!expectedChallenge) {
      return finish({ error: '등록 시간이 지났습니다. 다시 시도해 주세요.' }, 400)
    }

    const { rpID, origins } = getRpConfig()

    const verification = await verifyRegistrationResponse({
      response: body?.credential,
      expectedChallenge,
      expectedOrigin: origins,
      expectedRPID: rpID,
      requireUserVerification: true,
    })

    if (!verification.verified) {
      return finish({ error: '기기 확인에 실패했습니다.' }, 400)
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

    await prisma.adminCredential.create({
      data: {
        id: credential.id,
        publicKey: credential.publicKey,
        counter: BigInt(credential.counter),
        transports: credential.transports ?? [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        label,
      },
    })

    return finish({ success: true, id: credential.id, label }, 200)
  } catch (e) {
    // 같은 기기를 두 번 등록하면 기본키가 겹친다.
    if (e && typeof e === 'object' && (e as { code?: string }).code === 'P2002') {
      return finish({ error: '이미 등록된 기기입니다.' }, 409)
    }
    console.error('[passkey] 등록 확인 실패:', e)
    return finish({ error: '패스키를 등록하지 못했습니다.' }, 500)
  }
}
