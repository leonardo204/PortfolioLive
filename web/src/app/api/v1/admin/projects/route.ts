import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function isAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('admin-session')
  return !!session?.value
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const projects = await prisma.portfolioProject.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ year: 'desc' }, { title: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        technologies: true,
        year: true,
        githubUrl: true,
        lastSyncedAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(projects)
  } catch {
    return NextResponse.json(
      { error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, description, category } = body as {
      id: number
      description?: string
      category?: string
    }

    if (!id) {
      return NextResponse.json({ error: 'id는 필수입니다.' }, { status: 400 })
    }

    const project = await prisma.portfolioProject.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
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
