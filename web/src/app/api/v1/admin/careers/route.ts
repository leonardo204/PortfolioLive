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
