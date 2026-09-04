/**
 * 오류 화면이 그려졌다고 알리는 내부 창구.
 *
 * error.tsx는 브라우저에서 도는 화면이라 대시보드 토큰을 줄 수 없다.
 * 그래서 브라우저는 이 경로만 부르고, 실제 전송은 서버가 대신한다.
 * 받는 값은 상태 코드와 경로뿐이고, 코드는 500·404만 허용한다.
 */
import { NextResponse } from 'next/server'
import { reportStatus } from '@/lib/hit'

const ALLOWED = new Set([404, 500])

export async function POST(request: Request) {
  let status = 500
  let path = ''
  try {
    const body = (await request.json()) as { status?: number; path?: string }
    if (typeof body.status === 'number') status = body.status
    if (typeof body.path === 'string') path = body.path.slice(0, 200)
  } catch {
    /* 본문이 없으면 기본값(500)으로 본다 */
  }
  if (!ALLOWED.has(status)) return NextResponse.json({ ok: false }, { status: 400 })
  // 경로 없이 보내면 대시보드가 엉뚱한 줄을 고칠 수 있어 아예 넘기지 않는다.
  if (!path) return NextResponse.json({ ok: false, skipped: 'no-path' })

  await reportStatus(status, path)
  return NextResponse.json({ ok: true })
}
