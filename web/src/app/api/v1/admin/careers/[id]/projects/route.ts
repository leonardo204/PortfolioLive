import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  const { id } = await context.params
  const careerId = parseInt(id, 10)

  if (isNaN(careerId)) {
    return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
  }

  try {
    const projects = await prisma.workProject.findMany({
      where: { careerId },
      orderBy: [{ year: 'desc' }, { id: 'asc' }],
    })

    return NextResponse.json(projects)
  } catch {
    return NextResponse.json(
      { error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  const { id } = await context.params
  const careerId = parseInt(id, 10)

  if (isNaN(careerId)) {
    return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { year, title, description } = body

    if (!year || !title || !description) {
      return NextResponse.json(
        { error: '연도, 제목, 설명은 필수입니다.' },
        { status: 400 }
      )
    }

    const project = await prisma.workProject.create({
      data: {
        careerId,
        year: String(year),
        title,
        description,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: '프로젝트 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

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
    const { id: projectId, year, title, description } = body

    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const project = await prisma.workProject.update({
      where: { id: projectId, careerId },
      data: {
        ...(year !== undefined && { year: String(year) }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json(project)
  } catch {
    return NextResponse.json(
      { error: '프로젝트 수정 중 오류가 발생했습니다.' },
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
    const body = await request.json()
    const { id: projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    await prisma.workProject.delete({
      where: { id: projectId, careerId },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: '프로젝트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
