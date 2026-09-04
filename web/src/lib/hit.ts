/**
 * 방문 기록 한 건을 대시보드(ai.zerolive.co.kr)로 보낸다.
 *
 * 미들웨어에서 부르고 waitUntil로 뒤에서 보내므로 방문자가 기다리는 시간에는 영향이 없다.
 * 실패해도 조용히 넘어간다 — 기록이 화면을 막으면 안 된다.
 * 사람인지 크롤러인지 가리는 일은 대시보드가 한다(여기서는 값만 넘긴다).
 *
 * 상태 코드에 대해:
 * 미들웨어는 응답을 만들기 전 단계라 최종 코드를 모른다. 그래서 두 번에 나눠 기록한다.
 *  1) 미들웨어 — 자기가 만든 응답의 코드를 적는다(리디렉션 307·308, 통과는 200).
 *  2) 404·오류 화면 — 렌더될 때 fix 표시를 달아 다시 보낸다.
 *     대시보드는 같은 방문자의 최근 기록을 찾아 코드만 고쳐 쓴다(줄이 늘지 않는다).
 */
import type { NextRequest } from 'next/server'

const HIT_URL = 'https://ai.zerolive.co.kr/v1/hit'
const SITE = 'me'

/** 기록하지 않는 경로 — 화면이 아니라 브라우저가 자동으로 부르는 것들. */
const SKIP = /^\/(api|admin|poc|_next|images)(\/|$)/
const SKIP_EXT = /\.(ico|png|jpe?g|gif|webp|avif|svg|css|js|mjs|map|woff2?|ttf|otf|mp4|webm|mp3)$/i

export function shouldRecord(pathname: string): boolean {
  return !SKIP.test(pathname) && !SKIP_EXT.test(pathname)
}

function post(body: unknown): Promise<unknown> | null {
  const token = process.env.TRAFFIC_TOKEN
  if (!token) return null
  return fetch(HIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    cache: 'no-store',
  }).catch(() => undefined)
}

export function hitPayload(
  request: NextRequest,
  status: number | null,
  latencyMs: number | null
): Record<string, unknown> {
  const h = request.headers
  return {
    site: SITE,
    path: request.nextUrl.pathname,
    ua: h.get('user-agent') || '',
    ref: h.get('referer') || '',
    country: h.get('cf-ipcountry') || '',
    ip: h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
    method: request.method,
    status,
    latency_ms: latencyMs,
  }
}

export function sendHit(
  request: NextRequest,
  status: number | null = null,
  latencyMs: number | null = null
): Promise<unknown> | null {
  if (!shouldRecord(request.nextUrl.pathname)) return null
  return post(hitPayload(request, status, latencyMs))
}

/**
 * 404·오류 화면에서 부른다. 방금 미들웨어가 남긴 같은 방문자의 기록을 찾아
 * 상태 코드만 고쳐 쓴다. 못 찾으면 새 줄로 남는다.
 * 서버 컴포넌트에서만 쓴다(headers를 읽는다).
 */
export async function reportStatus(status: number, path?: string): Promise<void> {
  if (!process.env.TRAFFIC_TOKEN) return
  try {
    const { headers } = await import('next/headers')
    const h = await headers()
    await post({
      site: SITE,
      fix: true,
      status,
      path: path || h.get('x-invoke-path') || h.get('x-matched-path') || '',
      ua: h.get('user-agent') || '',
      ref: h.get('referer') || '',
      country: h.get('cf-ipcountry') || '',
      ip: h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
    })
  } catch {
    /* 기록 실패가 화면을 막지 않는다 */
  }
}
