'use client'

import { useEffect } from 'react'

/**
 * 404 화면이 그려졌다고 대시보드에 알린다.
 *
 * 미들웨어는 응답을 만들기 전 단계라 최종 코드를 모른다. 없는 주소인지 미리 알 수 있는
 * 경우는 거기서 404로 남기고, 그러지 못한 경우(있는 줄 알았는데 없는 글 등)를 여기서 고친다.
 * 지금 보고 있는 주소를 함께 보내야 엉뚱한 줄이 404로 바뀌지 않는다.
 */
export default function NotFoundBeacon() {
  useEffect(() => {
    fetch('/api/traffic-fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 404, path: window.location.pathname }),
      keepalive: true,
    }).catch(() => undefined)
  }, [])
  return null
}
