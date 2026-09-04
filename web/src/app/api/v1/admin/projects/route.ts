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
      orderBy: [{ featured: 'desc' }, { featuredOrder: 'asc' }, { year: 'desc' }, { title: 'asc' }],
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
        appStoreUrl: true,
        featured: true,
        featuredOrder: true,
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
    const { id, description, category, tags, featured, featuredOrder } = body as {
      id: number
      description?: string
      category?: string
      tags?: string[]
      featured?: boolean
      featuredOrder?: number
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

    // 주소 입력값 검사 — liveUrl과 appStoreUrl이 같은 규칙을 쓴다.
    // 빈 칸으로 저장하면 지운 것으로 본다.
    type UrlResult = { ok: true; value: string | null } | { ok: false; message: string }
    const readUrl = (field: 'liveUrl' | 'appStoreUrl'): UrlResult | undefined => {
      if (!(field in body)) return undefined
      const raw = (body as Record<string, unknown>)[field]
      if (raw === null) return { ok: true, value: null }
      if (typeof raw !== 'string') return { ok: false, message: `${field}은 문자열이어야 합니다.` }
      const trimmed = raw.trim()
      if (trimmed === '') return { ok: true, value: null }
      if (trimmed.length > 2048) return { ok: false, message: `${field}이 너무 깁니다 (최대 2048자).` }
      try {
        const u = new URL(trimmed)
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          return { ok: false, message: `${field}은 http(s) 주소만 넣을 수 있습니다.` }
        }
        return { ok: true, value: trimmed }
      } catch {
        return { ok: false, message: '주소 형식이 올바르지 않습니다.' }
      }
    }

    const liveResult = readUrl('liveUrl')
    if (liveResult && !liveResult.ok) {
      return NextResponse.json({ error: liveResult.message }, { status: 400 })
    }
    const appStoreResult = readUrl('appStoreUrl')
    if (appStoreResult && !appStoreResult.ok) {
      return NextResponse.json({ error: appStoreResult.message }, { status: 400 })
    }

    if (featured !== undefined && typeof featured !== 'boolean') {
      return NextResponse.json({ error: 'featured는 true/false여야 합니다.' }, { status: 400 })
    }
    if (
      featuredOrder !== undefined &&
      (!Number.isInteger(featuredOrder) || featuredOrder < 0 || featuredOrder > 999)
    ) {
      return NextResponse.json(
        { error: 'featuredOrder는 0~999 사이의 정수여야 합니다.' },
        { status: 400 }
      )
    }

    const project = await prisma.portfolioProject.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(liveResult?.ok && { liveUrl: liveResult.value }),
        ...(appStoreResult?.ok && { appStoreUrl: appStoreResult.value }),
        ...(featured !== undefined && { featured }),
        ...(featuredOrder !== undefined && { featuredOrder }),
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
