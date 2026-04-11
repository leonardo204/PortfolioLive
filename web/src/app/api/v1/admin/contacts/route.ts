import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  try {
    const contacts = await prisma.contactRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ contacts })
  } catch (err) {
    console.error('[Admin Contacts API]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { id, isRead } = body as { id: number; isRead: boolean }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updated = await prisma.contactRequest.update({
      where: { id },
      data: { isRead: isRead ?? true },
    })

    return NextResponse.json({ contact: updated })
  } catch (err) {
    console.error('[Admin Contacts PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
