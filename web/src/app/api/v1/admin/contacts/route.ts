import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError

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

export async function PATCH(req: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  try {
    const body = await req.json()
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
