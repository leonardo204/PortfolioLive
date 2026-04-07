'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ChatTrigger } from './chat-trigger'
import { ChatPanel } from './chat-panel'

export function ChatWrapper() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const pathname = usePathname()

  // 페이지 이동 시 채팅 닫기
  useEffect(() => {
    setIsChatOpen(false)
  }, [pathname])

  return (
    <>
      <ChatTrigger onClick={() => setIsChatOpen(true)} isOpen={isChatOpen} />
      {isChatOpen && (
        <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      )}
    </>
  )
}
