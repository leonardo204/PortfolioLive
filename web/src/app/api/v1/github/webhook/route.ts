import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { revalidatePath } from 'next/cache'

const AGENT_URL = process.env.AGENT_URL ?? 'http://localhost:3101'

function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) return true // secret 미설정 시 검증 스킵 (개발 환경)
  const expected = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`
  // timing-safe 비교
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET ?? ''
  const signature = req.headers.get('x-hub-signature-256') ?? ''
  const event = req.headers.get('x-github-event') ?? ''

  const rawBody = await req.text()

  // 서명 검증
  if (webhookSecret) {
    const isValid = verifySignature(rawBody, signature, webhookSecret)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  // push 이벤트 처리 (fire-and-forget: 즉시 202 반환 후 백그라운드 sync)
  if (event === 'push') {
    fetch(`${AGENT_URL}/agent/pipeline/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error(`[Webhook] Pipeline sync failed: ${res.status} ${await res.text()}`)
        } else {
          console.log('[Webhook] Pipeline sync completed successfully')
        }
        // sync 완료 후 ISR 캐시 갱신
        try { revalidatePath('/') } catch { /* noop outside caching context */ }
      })
      .catch((err) => console.error('[Webhook] Pipeline sync error:', err))

    return NextResponse.json({ ok: true, message: 'Pipeline sync triggered' }, { status: 202 })
  }

  // 다른 이벤트는 무시
  return NextResponse.json({ ok: true, message: `Event '${event}' ignored` })
}
