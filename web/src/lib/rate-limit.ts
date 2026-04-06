/**
 * PostgreSQL cache_store 기반 간단한 Rate Limiter
 * IP + 엔드포인트별 카운터로 요청 횟수를 제한합니다.
 */

import { prisma } from './prisma'

export interface RateLimitConfig {
  /** 시간 창 (초) */
  windowSeconds: number
  /** 시간 창 내 최대 요청 수 */
  maxRequests: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * 기본 설정 프리셋
 */
export const RATE_LIMIT_PRESETS = {
  /** 채팅: 분당 120회 (CopilotKit 내부 폴링 포함) */
  chat: { windowSeconds: 60, maxRequests: 120 } satisfies RateLimitConfig,
  /** 연락 폼: 하루 3회 */
  contact_daily: { windowSeconds: 60 * 60 * 24, maxRequests: 3 } satisfies RateLimitConfig,
  /** 연락 폼: 세션 1회 (1시간) */
  contact_session: { windowSeconds: 60 * 60, maxRequests: 1 } satisfies RateLimitConfig,
  /** 일반 API: 분당 60회 */
  default: { windowSeconds: 60, maxRequests: 60 } satisfies RateLimitConfig,
}

/**
 * IP + 엔드포인트 기반 rate limit 체크
 *
 * @param ip - 클라이언트 IP 주소
 * @param endpoint - 엔드포인트 식별자 (예: 'chat', 'contact')
 * @param config - rate limit 설정
 */
export async function checkRateLimit(
  ip: string,
  endpoint: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const key = `rl:${endpoint}:${ip}`
  const now = new Date()
  const windowMs = config.windowSeconds * 1000
  const resetAt = new Date(Math.ceil(now.getTime() / windowMs) * windowMs)

  try {
    // upsert: 없으면 생성, 있으면 카운터 증가
    const existing = await prisma.cacheStore.findUnique({ where: { key } })

    if (!existing || (existing.expiresAt && existing.expiresAt < now)) {
      // 새 창 시작
      await prisma.cacheStore.upsert({
        where: { key },
        create: {
          key,
          value: { count: 1 },
          expiresAt: resetAt,
        },
        update: {
          value: { count: 1 },
          expiresAt: resetAt,
        },
      })
      return {
        allowed: config.maxRequests >= 1,
        remaining: Math.max(0, config.maxRequests - 1),
        resetAt,
      }
    }

    // 기존 카운터 확인
    const currentCount = (existing.value as { count: number }).count ?? 0

    if (currentCount >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.expiresAt ?? resetAt,
      }
    }

    // 카운터 증가
    await prisma.cacheStore.update({
      where: { key },
      data: { value: { count: currentCount + 1 } },
    })

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - currentCount - 1),
      resetAt: existing.expiresAt ?? resetAt,
    }
  } catch (err) {
    // DB 오류 시 허용 (fail open)
    console.error('[RateLimit] DB error, failing open:', err)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt,
    }
  }
}

/**
 * NextRequest에서 클라이언트 IP 추출
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}
