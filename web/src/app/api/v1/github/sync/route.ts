import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

const AGENT_URL = process.env.AGENT_URL ?? 'http://localhost:3101'

export async function POST() {
  try {
    const res = await fetch(`${AGENT_URL}/agent/pipeline/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`[Sync] Pipeline sync failed: ${res.status} ${text}`)
      return NextResponse.json({ error: 'Pipeline sync failed' }, { status: 502 })
    }

    try { revalidatePath('/') } catch { /* noop */ }
    return NextResponse.json({ ok: true, message: 'Pipeline sync completed' })
  } catch (err) {
    console.error('[Sync] Pipeline sync error:', err)
    return NextResponse.json({ error: 'Pipeline sync error' }, { status: 502 })
  }
}
