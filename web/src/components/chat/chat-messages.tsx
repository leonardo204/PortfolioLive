'use client'

import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { type ChatMessage } from '@/lib/chat-client'
import { parseA2UI } from '@/lib/a2ui-parser'
import { A2UIRenderer } from './a2ui'
import { ThinkingIndicator } from './thinking-indicator'
import { WelcomeMessage } from './welcome-message'
import { PreSuggestion } from './pre-suggestion'

interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading: boolean
  thinking?: string
  onSuggestionSelect: (text: string) => void
  sessionEnded?: boolean
}

export function ChatMessages({ messages, isLoading, thinking, onSuggestionSelect, sessionEnded }: ChatMessagesProps) {
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
          return (
            <div key={message.id} className="flex flex-col items-end gap-1 ml-auto max-w-[85%]">
              <div className="bg-[#0053db] text-white p-4 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-sm">
                {message.content}
              </div>
            </div>
          )
        }

        if (message.role === 'assistant') {
          if (!message.content) return null

          // 스트리밍 중인 마지막 메시지 판별
          const isStreaming = isLoading && index === messages.length - 1

          return (
            <div key={message.id} className="flex flex-col items-start gap-1 max-w-[90%]">
              <div className="bg-[#f1f4f7] text-[#2b3438] p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed border border-[#eaeef2] prose prose-sm max-w-none prose-p:my-2.5 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-h3:mt-4 prose-h3:mb-2 prose-strong:text-[#2b3438] prose-a:text-[#0053db]">
                {isStreaming ? (
                  // 스트리밍 중: a2ui 마커를 숨기고 텍스트만 표시
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content.replace(/<!--a2ui[\s\S]*?(?:<!--\/a2ui-->|$)/g, '')}
                  </ReactMarkdown>
                ) : (
                  // 완료: A2UI 파싱 후 텍스트 + 리치 컴포넌트 렌더링
                  parseA2UI(message.content).map((segment, segIndex) =>
                    segment.type === 'text' ? (
                      <ReactMarkdown key={segIndex} remarkPlugins={[remarkGfm]}>
                        {segment.content}
                      </ReactMarkdown>
                    ) : (
                      <A2UIRenderer
                        key={segIndex}
                        component={segment.component}
                        data={segment.data}
                      />
                    )
                  )
                )}
              </div>
            </div>
          )
        }

        return null
      })}

      {/* Thinking indicator — thinking 텍스트가 있을 때만 표시 */}
      {isLoading && thinking && <ThinkingIndicator />}

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
