/**
 * Admin 세션 인증 모듈 — jose 기반 HS256 JWT
 *
 * jose를 쓰는 이유: Next.js 15 Edge runtime의 globalThis.crypto.subtle이
 * importKey/verify에서 ArrayBuffer 타입 체크를 realm 경계로 거부하는
 * 호환성 이슈가 있음. jose는 Edge runtime에 검증된 레퍼런스 구현.
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify, errors as joseErrors } from 'jose'

function getSecretBytes(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET ?? ''
  if (secret.length < 32) {
    throw new Error(
      `[admin-auth] ADMIN_SESSION_SECRET는 32자 이상이어야 합니다. 현재 ${secret.length}자. ` +
        'openssl rand -hex 32 로 생성하여 .env에 설정하세요.'
    )
  }
  return new TextEncoder().encode(secret)
}

export interface AdminSessionPayload {
  iss: 'admin'
  iat: number
  exp: number
  jti: string
}

export type AdminAuthResult =
  | { ok: true; payload: AdminSessionPayload }
  | { ok: false; response: NextResponse }

function generateJti(): string {
  const bytes = new Uint8Array(12)
  globalThis.crypto.getRandomValues(bytes)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function signAdminSession(ttlSeconds = 86400): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('admin')
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .setJti(generateJti())
    .sign(getSecretBytes())
}

export async function verifyAdminSession(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretBytes(), { issuer: 'admin' })
    if (
      payload.iss !== 'admin' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number' ||
      typeof payload.jti !== 'string'
    ) {
      return null
    }
    return {
      iss: 'admin',
      iat: payload.iat,
      exp: payload.exp,
      jti: payload.jti,
    }
  } catch (e) {
    if (
      !(e instanceof joseErrors.JWTExpired) &&
      !(e instanceof joseErrors.JWTInvalid) &&
      !(e instanceof joseErrors.JWSInvalid) &&
      !(e instanceof joseErrors.JWSSignatureVerificationFailed) &&
      !(e instanceof joseErrors.JWTClaimValidationFailed)
    ) {
      console.error('[admin-auth] JWT verify error:', e instanceof Error ? e.message : e)
    }
    return null
  }
}

/**
 * admin 인증 요구 — Discriminated union 반환
 *
 * request 인자가 있으면 해당 request의 쿠키를 사용 (route handler 호환)
 * request 인자가 없으면 next/headers의 cookies() API 사용 (server component 호환)
 */
export async function requireAdminAuth(request?: NextRequest): Promise<AdminAuthResult> {
  let token: string | undefined

  if (request) {
    token = request.cookies.get('admin-session')?.value
  } else {
    const cookieStore = await cookies()
    token = cookieStore.get('admin-session')?.value
  }

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 }),
    }
  }

  const payload = await verifyAdminSession(token)
  if (!payload) {
    return {
      ok: false,
      response: NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 }),
    }
  }

  return { ok: true, payload }
}
