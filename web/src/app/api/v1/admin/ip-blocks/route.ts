/**
 * 차단된 주소 관리.
 *
 * GET    목록 (차단된 것 먼저, 실패만 쌓인 것도 함께 보여준다)
 * POST   손으로 차단 추가
 * PATCH  차단 해제 / 다시 차단 / 메모 수정
 * DELETE 기록 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'
import { looksLikeIp, clientIpOf, MAX_FAILURES } from '@/lib/admin-ip-block'

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  try {
    const rows = await prisma.adminLoginBlock.findMany({
      orderBy: [{ blocked: 'desc' }, { lastFailedAt: 'desc' }],
      take: 200,
    })
    return NextResponse.json({
      // 지금 이 화면을 보고 있는 주소. 자기 주소를 실수로 막지 않게 표시한다.
      currentIp: clientIpOf(request),
      maxFailures: MAX_FAILURES,
      blocks: rows,
    })
  } catch {
    return NextResponse.json({ error: '목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  try {
    const body = (await request.json()) as { ip?: unknown; note?: unknown }
    const ip = typeof body.ip === 'string' ? body.ip.trim() : ''
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 200) : null

    if (!looksLikeIp(ip)) {
      return NextResponse.json({ error: '주소 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    const now = new Date()
    const row = await prisma.adminLoginBlock.upsert({
      where: { ip },
      create: {
        ip,
        failedCount: 0,
        blocked: true,
        firstFailedAt: now,
        lastFailedAt: now,
        blockedAt: now,
        note: note || '직접 추가',
      },
      update: {
        blocked: true,
        blockedAt: now,
        ...(note ? { note } : {}),
      },
    })

    return NextResponse.json(row, { status: 201 })
  } catch {
    return NextResponse.json({ error: '차단 추가에 실패했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  try {
    const body = (await request.json()) as {
      ip?: unknown
      blocked?: unknown
      note?: unknown
    }
    const ip = typeof body.ip === 'string' ? body.ip.trim() : ''
    if (!ip) {
      return NextResponse.json({ error: 'ip는 필수입니다.' }, { status: 400 })
    }
    if (body.blocked !== undefined && typeof body.blocked !== 'boolean') {
      return NextResponse.json({ error: 'blocked는 true/false여야 합니다.' }, { status: 400 })
    }

    const blocked = body.blocked as boolean | undefined
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 200) : undefined

    const row = await prisma.adminLoginBlock.update({
      where: { ip },
      data: {
        ...(blocked !== undefined && {
          blocked,
          blockedAt: blocked ? new Date() : null,
          // 풀어줄 때는 실패 횟수도 0으로 되돌린다. 바로 다시 막히면 푼 의미가 없다.
          ...(blocked ? {} : { failedCount: 0 }),
        }),
        ...(note !== undefined && { note: note || null }),
      },
    })

    return NextResponse.json(row)
  } catch {
    return NextResponse.json({ error: '변경에 실패했습니다.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAuth(request)
  if (!auth.ok) return auth.response

  const ip = new URL(request.url).searchParams.get('ip')?.trim()
  if (!ip) {
    return NextResponse.json({ error: 'ip는 필수입니다.' }, { status: 400 })
  }

  try {
    await prisma.adminLoginBlock.deleteMany({ where: { ip } })
    return NextResponse.json({ deleted: ip })
  } catch {
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 })
  }
}
