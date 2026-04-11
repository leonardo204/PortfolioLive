/**
 * Admin 세션 인증 모듈 — Edge-compatible HMAC-SHA256
 *
 * 요구사항:
 * - node:crypto / Buffer 금지 → globalThis.crypto.subtle 사용
 * - ADMIN_SESSION_SECRET 32자 미만이면 모듈 import 시 throw
 * - Discriminated union 반환 타입
 * - 타이밍 공격 방지: crypto.subtle.verify 사용
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// ─── secret (런타임에 로드) ───────────────────────────────────────────────
// 빌드 타임이 아닌 런타임에 검증 — Next.js 빌드 시 환경변수 없어도 통과
function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? ''
  if (secret.length < 32) {
    throw new Error(
      `[admin-auth] ADMIN_SESSION_SECRET는 32자 이상이어야 합니다. 현재 ${secret.length}자. ` +
        'openssl rand -hex 32 로 생성하여 .env에 설정하세요.'
    )
  }
  return secret
}

// ─── 타입 ─────────────────────────────────────────────────────────────────
export interface AdminSessionPayload {
  iss: 'admin'
  iat: number // seconds since epoch
  exp: number // seconds since epoch
  jti: string // 16자 random base64url
}

export type AdminAuthResult =
  | { ok: true; payload: AdminSessionPayload }
  | { ok: false; response: NextResponse }

// ─── base64url 유틸 (의존성 없이) ─────────────────────────────────────────
export function bytesToBase64url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function base64urlToBytes(s: string): Uint8Array {
  // base64url → base64
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function textToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

export function bytesToText(b: Uint8Array): string {
  return new TextDecoder().decode(b)
}

// ─── HMAC 키 (모듈 스코프 캐싱) ───────────────────────────────────────────
let _keyPromise: Promise<CryptoKey> | null = null

// Uint8Array를 ArrayBuffer로 변환 (TypeScript crypto API 타입 호환)
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function importKey(): Promise<CryptoKey> {
  if (!_keyPromise) {
    // getSecret()이 런타임에 호출되어 32자 미만이면 throw
    _keyPromise = globalThis.crypto.subtle.importKey(
      'raw',
      toArrayBuffer(textToBytes(getSecret())),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    ).catch((e) => {
      _keyPromise = null  // 실패 시 캐시 무효화 — 다음 호출에서 재시도 가능
      throw e
    })
  }
  return _keyPromise
}

// ─── 서명 생성 ────────────────────────────────────────────────────────────
async function signPayload(payloadB64: string): Promise<string> {
  const key = await importKey()
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, toArrayBuffer(textToBytes(payloadB64)))
  return bytesToBase64url(new Uint8Array(sig))
}

// ─── 서명 검증 (타이밍 공격 방지) ────────────────────────────────────────
async function verifySignature(payloadB64: string, sigB64url: string): Promise<boolean> {
  try {
    const key = await importKey()
    const sigBytes = base64urlToBytes(sigB64url)
    return await globalThis.crypto.subtle.verify(
      'HMAC',
      key,
      toArrayBuffer(sigBytes),
      toArrayBuffer(textToBytes(payloadB64))
    )
  } catch (e) {
    // secret 미설정/파싱 실패 등을 서버 로그로 추적 (secret 값 자체는 로그 출력 금지)
    console.error('[admin-auth] HMAC verify failed:', e instanceof Error ? e.message : e)
    return false
  }
}

// ─── jti 생성 (16자 base64url) ────────────────────────────────────────────
function generateJti(): string {
  const bytes = new Uint8Array(12)
  globalThis.crypto.getRandomValues(bytes)
  return bytesToBase64url(bytes)
}

// ─── 공개 API ─────────────────────────────────────────────────────────────

/**
 * admin 세션 토큰 서명 생성
 * @param ttlSeconds 기본 24시간
 * @returns base64url(payload).base64url(signature)
 */
export async function signAdminSession(ttlSeconds = 86400): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminSessionPayload = {
    iss: 'admin',
    iat: now,
    exp: now + ttlSeconds,
    jti: generateJti(),
  }
  const payloadB64 = bytesToBase64url(textToBytes(JSON.stringify(payload)))
  const sig = await signPayload(payloadB64)
  return `${payloadB64}.${sig}`
}

/**
 * admin 세션 토큰 검증
 * @returns 유효하면 payload, 실패 시 null
 */
export async function verifyAdminSession(token: string): Promise<AdminSessionPayload | null> {
  // 1. 형식 확인 (점 하나로 구분된 두 파트)
  const dotIdx = token.indexOf('.')
  if (dotIdx === -1) return null

  const payloadB64 = token.slice(0, dotIdx)
  const sigB64 = token.slice(dotIdx + 1)

  if (!payloadB64 || !sigB64) return null

  // 2. 서명 검증 (타이밍 공격 방지)
  const valid = await verifySignature(payloadB64, sigB64)
  if (!valid) return null

  // 3. payload 디코드
  let payload: AdminSessionPayload
  try {
    const jsonBytes = base64urlToBytes(payloadB64)
    const jsonStr = bytesToText(jsonBytes)
    const raw = JSON.parse(jsonStr)
    // 런타임 타입 검증 — 타입 단언만으로는 NaN/null 우회 방지 불가
    if (
      typeof raw !== 'object' || raw === null ||
      raw.iss !== 'admin' ||
      typeof raw.iat !== 'number' ||
      typeof raw.exp !== 'number' ||
      typeof raw.jti !== 'string'
    ) {
      return null
    }
    payload = raw as AdminSessionPayload
  } catch {
    return null
  }

  // 4. iss 확인 (런타임 검증에서 이미 확인했지만 타입 안전성을 위해 유지)
  if (payload.iss !== 'admin') return null

  // 5. 만료 확인 (NaN 비교 방지: typeof 검증으로 number 타입 보장됨)
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp < now) return null

  return payload
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
