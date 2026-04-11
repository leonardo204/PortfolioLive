import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

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
        tags: true,
        year: true,
        githubUrl: true,
        liveUrl: true,
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
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { id, description, category, tags } = body as {
      id: number
      description?: string
      category?: string
      tags?: string[]
    }

    if (!id) {
      return NextResponse.json({ error: 'id는 필수입니다.' }, { status: 400 })
    }

    // tags 런타임 검증
    if (tags !== undefined) {
      if (
        !Array.isArray(tags) ||
        !tags.every((t: unknown) => typeof t === 'string' && t.length > 0 && t.length <= 50)
      ) {
        return NextResponse.json(
          { error: 'tags는 50자 이하 문자열 배열이어야 합니다.' },
          { status: 400 }
        )
      }
    }

    // liveUrl 검증 및 sanitize
    let liveUrlValue: string | null | undefined = undefined
    if ('liveUrl' in body) {
      const raw = (body as { liveUrl?: unknown }).liveUrl
      if (raw === null) {
        liveUrlValue = null
      } else if (typeof raw !== 'string') {
        return NextResponse.json({ error: 'liveUrl은 문자열이어야 합니다.' }, { status: 400 })
      } else {
        const trimmed = raw.trim()
        if (trimmed === '') {
          liveUrlValue = null
        } else if (trimmed.length > 2048) {
          return NextResponse.json({ error: 'liveUrl이 너무 깁니다 (최대 2048자).' }, { status: 400 })
        } else {
          try {
            const u = new URL(trimmed)
            if (u.protocol !== 'http:' && u.protocol !== 'https:') {
              return NextResponse.json({ error: 'liveUrl은 http(s) 스키마만 허용됩니다.' }, { status: 400 })
            }
            liveUrlValue = trimmed
          } catch {
            return NextResponse.json({ error: '유효한 URL 형식이 아닙니다.' }, { status: 400 })
          }
        }
      }
    }

    const project = await prisma.portfolioProject.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(liveUrlValue !== undefined && { liveUrl: liveUrlValue }),
        ...(tags !== undefined && { tags }),
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
