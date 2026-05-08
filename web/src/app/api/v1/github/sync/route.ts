import { NextResponse, after } from 'next/server'
import { revalidatePath } from 'next/cache'

const AGENT_URL = process.env.AGENT_URL ?? 'http://localhost:3101'

export async function POST() {
  // Next.js 15 after(): 응답 반환 후 백그라운드 작업 보장 실행 (Cloudflare 524 회피)
  after(async () => {
    try {
      const res = await fetch(`${AGENT_URL}/agent/pipeline/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.status === 409) {
        console.log('[Sync] Pipeline sync already in progress, skipping duplicate')
      } else if (!res.ok) {
        console.error(`[Sync] Pipeline sync failed: ${res.status} ${await res.text()}`)
      } else {
        console.log('[Sync] Pipeline sync completed successfully')
      }
      try { revalidatePath('/') } catch { /* noop outside caching context */ }
    } catch (err) {
      console.error('[Sync] Pipeline sync error:', err)
    }
  })

  return NextResponse.json({ ok: true, message: 'Pipeline sync triggered' }, { status: 202 })
}
