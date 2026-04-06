'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 페이지 방문을 서버에 기록하는 클라이언트 컴포넌트
 * layout.tsx에 추가합니다.
 */
export function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // admin, api 경로는 추적하지 않음
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return

    const referrer = document.referrer || undefined

    fetch('/api/v1/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer }),
    }).catch(() => {
      // silent fail — 추적 실패가 UX에 영향 없도록
    })
  }, [pathname])

  return null
}
