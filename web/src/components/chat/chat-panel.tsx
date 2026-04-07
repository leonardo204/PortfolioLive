'use client'

import { useState, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { sendChatMessage, type ChatMessage } from '@/lib/chat-client'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const threadId = useRef(crypto.randomUUID())

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
    }

    const assistantId = crypto.randomUUID()
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setIsLoading(true)

    await sendChatMessage(
      [...messages, userMessage],
      threadId.current,
      // onToken: assistant 메시지에 토큰 누적
      (token) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + token } : m,
          ),
        )
      },
      // onThinking: 현재는 별도 처리 없음
      () => {},
      // onDone
      () => setIsLoading(false),
      // onError
      (error) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: `오류: ${error}` } : m,
          ),
        )
        setIsLoading(false)
      },
    )
  }, [isLoading, messages])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 데스크톱: 투명 오버레이 (클릭 시 닫기) */}
          <motion.div
            key="desktop-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden md:block fixed inset-0 z-30"
            onClick={onClose}
          />

          {/* 모바일 딤 오버레이 */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={onClose}
          />

          {/* 데스크톱: 우측 사이드 패널 */}
          <motion.aside
            key="desktop-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="hidden md:flex fixed right-0 top-0 h-full w-[400px] z-40 flex-col bg-white border-l border-[#eaeef2] shadow-xl"
            aria-label="채팅 패널"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-[#eaeef2] flex-shrink-0">
              <span className="text-sm font-semibold text-[#2b3438]">Chat</span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f4f7] transition-colors"
                aria-label="채팅 닫기"
              >
                <X size={16} className="text-[#586065]" />
              </button>
            </div>

            {/* 메시지 영역 */}
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              onSuggestionSelect={handleSend}
            />

            {/* 입력 영역 */}
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </motion.aside>

          {/* 모바일: 바텀 시트 */}
          <motion.div
            key="mobile-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden fixed bottom-0 left-0 right-0 h-[85vh] z-40 bg-white rounded-t-[20px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] flex flex-col"
            aria-label="채팅 패널"
          >
            {/* 드래그 핸들 */}
            <div className="w-full flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-9 h-1.5 bg-[#abb3b9]/30 rounded-full" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-[#eaeef2] flex-shrink-0">
              <span className="text-base font-bold text-[#2b3438]">Chat</span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f1f4f7] hover:bg-[#eaeef2] transition-colors"
                aria-label="채팅 닫기"
              >
                <X size={14} className="text-[#586065]" />
              </button>
            </div>

            {/* 메시지 영역 */}
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              onSuggestionSelect={handleSend}
            />

            {/* 입력 영역 */}
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
