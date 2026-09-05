/**
 * 등록된 패스키 목록 조회·이름 변경·삭제.
 * 모두 로그인한 상태에서만 부를 수 있다.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { listCredentials, normalizeLabel } from '@/lib/passkey'

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  try {
    return NextResponse.json(await listCredentials())
  } catch {
    return NextResponse.json({ error: '패스키 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const id = typeof body?.id === 'string' ? body.id : ''
    if (!id) {
      return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
    }

    const updated = await prisma.adminCredential.update({
      where: { id },
      data: { label: normalizeLabel(body?.label) },
      select: { id: true, label: true },
    })
    return NextResponse.json(updated)
  } catch (e) {
    if (e && typeof e === 'object' && (e as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: '없는 패스키입니다.' }, { status: 404 })
    }
    return NextResponse.json({ error: '이름을 바꾸지 못했습니다.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  const id = request.nextUrl.searchParams.get('id') ?? ''
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
  }

  try {
    await prisma.adminCredential.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e && typeof e === 'object' && (e as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: '없는 패스키입니다.' }, { status: 404 })
    }
    return NextResponse.json({ error: '패스키를 지우지 못했습니다.' }, { status: 500 })
  }
}
