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

/**
 * 이 앱에 실제로 있는 주소.
 *
 * 미들웨어는 화면을 그리기 전 단계라 최종 코드를 모른다. 그래서 주소만 보고 판단한다.
 * 실제 404의 대부분은 자동 스캐너가 /wp-login.php · /.env 같은 없는 주소를 두드려 보는
 * 것이고, 그런 요청은 아래 어디에도 걸리지 않는다. 목록에 없으면 404로 적는다.
 *
 * 목록에 있어도 404가 날 수 있다(없는 글 주소 등). 그건 여기서 알 수 없으므로 200으로
 * 두고, 404 화면이 그려질 때 브라우저가 고쳐 보낸다(components/NotFoundBeacon).
 *
 * 실제 라우트: src/app/page.tsx · [locale]/page.tsx · [locale]/portfolio/[slug]/page.tsx
 *             portfolio/[slug]/page.tsx · poc/page.tsx · robots.txt · sitemap.xml
 */
const LOC = 'ko|en'
const KNOWN_PATHS: RegExp[] = [
  /^\/$/,                                                    // 루트 — next-intl이 /ko로 넘긴다
  new RegExp(`^/(${LOC})/?$`),                                // 언어별 첫 화면
  new RegExp(`^/((${LOC})/)?portfolio/[^/]+/?$`),             // 포트폴리오 글 한 편
  /^\/poc\/?$/,
  /^\/(robots\.txt|sitemap\.xml|llms\.txt|favicon\.ico|manifest\.webmanifest)$/,
  /^\/(opengraph-image|twitter-image|icon|apple-icon)/,      // 이미지 라우트(뒤에 해시가 붙는다)
  /^\/(api|admin)(\/|$)/,                                    // 기록에서 빠지지만 만약을 위해
]

export function looksMissing(pathname: string): boolean {
  return !KNOWN_PATHS.some((re) => re.test(pathname))
}

export function shouldRecord(pathname: string): boolean {
  return !SKIP.test(pathname) && !SKIP_EXT.test(pathname)
}

/**
 * 화면을 그리지 않고 뒤에서 가져가는 요청인가.
 *
 * Next.js 는 화면에 보이는 <Link> 를 미리 당겨 둔다. 첫 화면을 한 번 열면 포트폴리오
 * 상세 링크 수십 개가 1~2초 안에 함께 요청된다. 사람이 그 화면들을 본 것이 아닌데도
 * 방문으로 세면 숫자가 통째로 어긋난다(실제로 me 의 사람 방문 중 41%가 이것이었다).
 *
 * Next.js 가 붙이는 표식으로는 가릴 수 없다. next-router-prefetch·rsc 헤더도,
 * 주소에 붙는 _rsc 도 미들웨어로 넘기기 전에 지워진다(둘 다 붙여 불러 봤더니 그대로
 * 기록됐다). 그래서 브라우저가 붙이고 Next.js 가 건드리지 않는 Sec-Fetch-Dest 를 본다.
 *
 *   document  주소창·링크로 화면을 통째로 연 것          → 센다
 *   empty     fetch 로 뒤에서 가져간 것(프리페치·화면 전환) → 세지 않는다
 *   (없음)     크롤러·curl 처럼 이 헤더를 안 붙이는 쪽       → 센다
 *
 * 화면 전환(링크 클릭)도 함께 빠진다. 프리페치와 구분할 방법이 서버에 남아 있지 않고,
 * 프리페치가 잘 되면 눌렀을 때 요청 자체가 가지 않아 어느 쪽이든 '사람이 본 화면 수'와
 * 맞지 않는다. 그래서 여기서는 '들어온 횟수'만 세고, 화면 단위 조회수는 브라우저에서
 * 도는 PageTracker 가 이 앱의 page_views 표에 따로 센다.
 */
export function isBackgroundFetch(request: NextRequest): boolean {
  const h = request.headers
  const dest = (h.get('sec-fetch-dest') || '').toLowerCase()
  if (dest && dest !== 'document') return true
  // 아래 표식들은 지금은 미들웨어까지 오지 않지만, 앞에 무엇이 끼거나 Next.js 가
  // 동작을 바꾸면 여기서 걸린다. 오면 확실한 근거라 그대로 쓴다.
  if (request.nextUrl.searchParams.has('_rsc')) return true
  if ((h.get('sec-purpose') || '').toLowerCase().includes('prefetch')) return true
  if ((h.get('purpose') || '').toLowerCase() === 'prefetch') return true
  if ((h.get('x-moz') || '').toLowerCase() === 'prefetch') return true
  if (h.get('next-router-prefetch')) return true
  if (h.get('next-router-segment-prefetch')) return true
  return false
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
  if (isBackgroundFetch(request)) return null
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
