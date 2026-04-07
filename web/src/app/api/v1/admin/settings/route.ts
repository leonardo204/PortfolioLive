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
    const prefix = searchParams.get('prefix')

    const settings = await prisma.adminSetting.findMany({
      where: prefix
        ? { key: { startsWith: prefix } }
        : { isPublic: true },
      orderBy: { key: 'asc' },
    })

    return NextResponse.json(settings)
  } catch {
    return NextResponse.json(
      { error: '설정 조회 중 오류가 발생했습니다.' },
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
    const { key, value } = body as { key: string; value: string }

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'key와 value는 필수입니다.' },
        { status: 400 }
      )
    }

    const setting = await prisma.adminSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, isPublic: true },
    })

    return NextResponse.json(setting)
  } catch {
    return NextResponse.json(
      { error: '설정 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
