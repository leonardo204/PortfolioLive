'use client'

import { useState } from 'react'
import { ChatTrigger } from './chat-trigger'
import { ChatPanel } from './chat-panel'

export function ChatWrapper() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      <ChatTrigger onClick={() => setIsChatOpen(true)} isOpen={isChatOpen} />
      {isChatOpen && (
        <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      )}
    </>
  )
}
