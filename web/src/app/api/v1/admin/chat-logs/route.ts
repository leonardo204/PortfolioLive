import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  try {
    const sessions = await prisma.chatSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 100,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            modelUsed: true,
            latencyMs: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json({ sessions })
  } catch (err) {
    console.error('[Admin Chat Logs API]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
