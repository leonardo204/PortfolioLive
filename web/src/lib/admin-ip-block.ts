/**
 * 관리자 로그인 실패 기록과 주소 차단.
 *
 * 비밀번호를 연달아 틀린 주소를 막는다. 패스키 로그인은 여기에 걸리지 않으므로,
 * 본인이 오타로 잠기더라도 등록해 둔 기기로 들어와 관리 화면에서 풀 수 있다.
 *
 * 차단은 저절로 풀리지 않는다. 관리 화면에서 직접 풀어야 한다.
 */

import type { NextRequest } from 'next/server'
import { prisma } from './prisma'

/** 이 횟수만큼 틀리면 막는다. */
export const MAX_FAILURES = 3

/**
 * 마지막 실패로부터 이 시간이 지나면 실패 횟수를 0으로 되돌린다.
 * 며칠 전 오타 두 번이 오늘 한 번과 합쳐져 막히는 것을 피한다.
 * 이미 막힌 주소에는 적용하지 않는다.
 */
export const FAILURE_WINDOW_MINUTES = 30

/**
 * 요청을 보낸 주소를 고른다.
 * 이 사이트는 Cloudflare 뒤에 있어 CF-Connecting-IP가 가장 정확하다.
 * 그 값이 없을 때만 다른 헤더를 본다.
 */
export function clientIpOf(request: NextRequest): string {
  const h = request.headers
  const raw =
    h.get('cf-connecting-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    ''
  return raw.trim().slice(0, 64) || 'unknown'
}

/** 주소 형태인지 본다. 관리 화면에서 손으로 넣을 때 오타를 거른다. */
export function looksLikeIp(value: string): boolean {
  const v = value.trim()
  if (!v || v.length > 64) return false
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) {
    return v.split('.').every((n) => Number(n) <= 255)
  }
  // IPv6 (약식 표기 포함)
  return /^[0-9a-fA-F:]+$/.test(v) && v.includes(':')
}

/** 지금 막혀 있는 주소인지. 로그인 처리 맨 앞에서 부른다. */
export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false
  try {
    const row = await prisma.adminLoginBlock.findUnique({
      where: { ip },
      select: { blocked: true },
    })
    return row?.blocked ?? false
  } catch (e) {
    // 데이터베이스가 답하지 않으면 막지 않는다. 기록 때문에 본인이 못 들어가면 안 된다.
    console.error('[ip-block] 조회 실패:', e)
    return false
  }
}

export interface FailureResult {
  /** 이번 실패로 막혔는지 */
  blocked: boolean
  /** 막히기까지 남은 횟수 */
  remaining: number
}

/** 비밀번호를 틀렸을 때 부른다. 정해진 횟수를 넘기면 그 자리에서 막는다. */
export async function recordLoginFailure(
  ip: string,
  userAgent: string | null
): Promise<FailureResult> {
  if (!ip || ip === 'unknown') {
    return { blocked: false, remaining: MAX_FAILURES }
  }

  const now = new Date()
  const ua = userAgent?.slice(0, 300) || null

  try {
    const existing = await prisma.adminLoginBlock.findUnique({ where: { ip } })

    // 오래전 실패는 잊는다(이미 막힌 주소는 그대로 둔다).
    const staleAfter = new Date(now.getTime() - FAILURE_WINDOW_MINUTES * 60_000)
    const carried =
      existing && !existing.blocked && existing.lastFailedAt < staleAfter
        ? 0
        : existing?.failedCount ?? 0

    const failedCount = carried + 1
    const blocked = existing?.blocked || failedCount >= MAX_FAILURES

    await prisma.adminLoginBlock.upsert({
      where: { ip },
      create: {
        ip,
        failedCount,
        blocked,
        firstFailedAt: now,
        lastFailedAt: now,
        blockedAt: blocked ? now : null,
        lastUserAgent: ua,
      },
      update: {
        failedCount,
        blocked,
        lastFailedAt: now,
        // 이미 막힌 시각이 있으면 덮어쓰지 않는다.
        blockedAt: blocked ? existing?.blockedAt ?? now : null,
        lastUserAgent: ua,
        ...(carried === 0 ? { firstFailedAt: now } : {}),
      },
    })

    return { blocked, remaining: Math.max(0, MAX_FAILURES - failedCount) }
  } catch (e) {
    console.error('[ip-block] 기록 실패:', e)
    return { blocked: false, remaining: MAX_FAILURES }
  }
}

/**
 * 로그인에 성공하면 그 주소의 실패 기록을 지운다.
 * 막힌 주소는 손대지 않는다(막힌 채로는 애초에 여기까지 오지 않는다).
 */
export async function clearLoginFailures(ip: string): Promise<void> {
  if (!ip || ip === 'unknown') return
  try {
    await prisma.adminLoginBlock.deleteMany({ where: { ip, blocked: false } })
  } catch (e) {
    console.error('[ip-block] 정리 실패:', e)
  }
}
