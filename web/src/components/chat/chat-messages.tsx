'use client'

import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useCopilotChatHeadless_c } from '@copilotkit/react-core'
import { ThinkingIndicator } from './thinking-indicator'
import { WelcomeMessage } from './welcome-message'
import { PreSuggestion } from './pre-suggestion'

interface ChatMessagesProps {
  onSuggestionSelect: (text: string) => void
  sessionEnded?: boolean
}

export function ChatMessages({ onSuggestionSelect, sessionEnded }: ChatMessagesProps) {
  const { messages, isLoading } = useCopilotChatHeadless_c()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const hasUserMessages = messages.some((m) => m.role === 'user')

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#e2e9ee] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
      {/* 환영 메시지 */}
      <WelcomeMessage />

      {/* Pre-suggestion: 유저 메시지가 없을 때만 표시 */}
      {!hasUserMessages && (
        <PreSuggestion onSelect={onSuggestionSelect} disabled={isLoading || sessionEnded} />
      )}

      {/* 메시지 목록 */}
      {messages.map((message, index) => {
        if (message.role === 'user') {
          const content = typeof message.content === 'string'
            ? message.content
            : Array.isArray(message.content)
            ? message.content
                .filter((c: { type: string }) => c.type === 'text')
                .map((c: { type: string; text?: string }) => c.text ?? '')
                .join('')
            : ''

          return (
            <div key={index} className="flex flex-col items-end gap-1 ml-auto max-w-[85%]">
              <div className="bg-[#0053db] text-white p-4 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-sm">
                {content}
              </div>
            </div>
          )
        }

        if (message.role === 'assistant') {
          const content = message.content
          if (!content) return null

          return (
            <div key={index} className="flex flex-col items-start gap-1 max-w-[90%]">
              <div className="bg-[#f1f4f7] text-[#2b3438] p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed border border-[#eaeef2] prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-[#2b3438] prose-a:text-[#0053db]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          )
        }

        return null
      })}

      {/* Thinking indicator */}
      {isLoading && <ThinkingIndicator />}

      {/* session ended */}
      {sessionEnded && (
        <div className="text-center text-xs text-[#737c81] py-2">
          세션이 종료되었습니다.
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
