import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const VISITOR_COOKIE = 'visitor_id'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      sessionId,
      role,
      content,
      modelUsed,
      latencyMs,
    } = body as {
      sessionId?: string
      role: 'user' | 'assistant'
      content: string
      modelUsed?: string
      latencyMs?: number
    }

    if (!role || !content) {
      return NextResponse.json({ error: 'role and content are required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const visitorId = cookieStore.get(VISITOR_COOKIE)?.value ?? randomUUID()

    // 세션 찾거나 생성
    let session
    if (sessionId) {
      session = await prisma.chatSession.findFirst({
        where: { visitorId, id: parseInt(sessionId, 10) },
      })
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          visitorId,
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
          userAgent: req.headers.get('user-agent') ?? null,
          referrer: req.headers.get('referer') ?? null,
        },
      })
    }

    // 메시지 저장
    const message = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role,
        content,
        modelUsed: modelUsed ?? null,
        latencyMs: latencyMs ?? null,
      },
    })

    // messageCount 업데이트
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { messageCount: { increment: 1 } },
    })

    return NextResponse.json({ ok: true, sessionId: session.id, messageId: message.id })
  } catch (err) {
    console.error('[Chat Save API]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
