import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  const { id } = await context.params
  const careerId = parseInt(id, 10)

  if (isNaN(careerId)) {
    return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const {
      company,
      companyType,
      department,
      position,
      location,
      startedAt,
      endedAt,
      isCurrent,
      techTransition,
      summary,
      sortOrder,
    } = body

    const career = await prisma.career.update({
      where: { id: careerId },
      data: {
        ...(company !== undefined && { company }),
        ...(companyType !== undefined && { companyType }),
        ...(department !== undefined && { department }),
        ...(position !== undefined && { position }),
        ...(location !== undefined && { location }),
        ...(startedAt !== undefined && { startedAt: new Date(startedAt) }),
        ...(endedAt !== undefined && { endedAt: endedAt ? new Date(endedAt) : null }),
        ...(isCurrent !== undefined && { isCurrent }),
        ...(techTransition !== undefined && { techTransition: techTransition || null }),
        ...(summary !== undefined && { summary: summary || null }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json(career)
  } catch {
    return NextResponse.json(
      { error: '경력 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  const { id } = await context.params
  const careerId = parseInt(id, 10)

  if (isNaN(careerId)) {
    return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
  }

  try {
    // 연관된 work_projects 먼저 삭제
    await prisma.workProject.deleteMany({ where: { careerId } })
    await prisma.career.delete({ where: { id: careerId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: '경력 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
