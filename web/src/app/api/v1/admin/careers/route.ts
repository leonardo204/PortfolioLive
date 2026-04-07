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
    const careers = await prisma.career.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { workProjects: true },
        },
      },
    })

    return NextResponse.json(careers)
  } catch {
    return NextResponse.json(
      { error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
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

    if (!company || !companyType || !department || !position || !location || !startedAt) {
      return NextResponse.json(
        { error: '회사명, 회사유형, 부서, 직책, 위치, 입사일은 필수입니다.' },
        { status: 400 }
      )
    }

    const career = await prisma.career.create({
      data: {
        company,
        companyType,
        department,
        position,
        location,
        startedAt: new Date(startedAt),
        endedAt: endedAt ? new Date(endedAt) : null,
        isCurrent: isCurrent ?? false,
        techTransition: techTransition || null,
        summary: summary || null,
        sortOrder: sortOrder ?? 0,
      },
    })

    return NextResponse.json(career, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: '경력 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
