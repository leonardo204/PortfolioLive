import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  try {
    const [
      totalVisitors,
      totalSessions,
      totalMessages,
      totalContacts,
      unreadContacts,
    ] = await Promise.all([
      prisma.pageView.count(),
      prisma.chatSession.count(),
      prisma.chatMessage.count(),
      prisma.contactRequest.count(),
      prisma.contactRequest.count({ where: { isRead: false } }),
    ])

    return NextResponse.json({
      totalVisitors,
      totalSessions,
      totalMessages,
      totalContacts,
      unreadContacts,
    })
  } catch (err) {
    console.error('[Admin Dashboard API]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
