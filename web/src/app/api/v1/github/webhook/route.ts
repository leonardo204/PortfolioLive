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

  // push 이벤트 처리
  if (event === 'push') {
    try {
      // Agent 파이프라인 동기화 트리거
      const syncRes = await fetch(`${AGENT_URL}/agent/pipeline/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(60_000),
      })

      if (!syncRes.ok) {
        const errText = await syncRes.text()
        console.error(`[Webhook] Pipeline sync failed: ${syncRes.status} ${errText}`)
      } else {
        console.log('[Webhook] Pipeline sync triggered successfully')
      }
    } catch (err) {
      console.error('[Webhook] Pipeline sync error:', err)
    }

    // ISR 캐시 갱신
    try {
      revalidatePath('/')
    } catch {
      // revalidatePath는 캐싱 컨텍스트 밖에서 noop
    }

    return NextResponse.json({ ok: true, message: 'Pipeline sync triggered' })
  }

  // 다른 이벤트는 무시
  return NextResponse.json({ ok: true, message: `Event '${event}' ignored` })
}
