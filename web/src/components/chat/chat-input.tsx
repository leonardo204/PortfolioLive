'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import { SendHorizonal } from 'lucide-react'

interface ChatInputProps {
  onSend: (text: string) => void
  isLoading?: boolean
  sessionEnded?: boolean
}

export function ChatInput({ onSend, isLoading = false, sessionEnded }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const t = useTranslations('chat')

  const isDisabled = isLoading || !!sessionEnded

  const handleSend = () => {
    const text = input.trim()
    if (!text || isDisabled) return
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    onSend(text)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  if (sessionEnded) {
    return (
      <div className="p-4 border-t border-[#eaeef2] bg-white">
        <div className="flex items-center justify-center py-2 text-sm text-[#737c81]">
          세션이 종료되었습니다
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border-t border-[#eaeef2] bg-white">
      <div className="flex items-end gap-2 bg-[#f1f4f7] rounded-2xl px-4 py-2 border border-[#abb3b9]/20 focus-within:border-[#0053db]/30 focus-within:bg-white transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={t('placeholder')}
          disabled={isDisabled}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-[#2b3438] placeholder:text-[#737c81] disabled:opacity-50 py-1 max-h-[120px] leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={isDisabled || !input.trim()}
          className="w-8 h-8 bg-[#0053db] text-white rounded-full flex items-center justify-center hover:bg-[#0048c1] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
          aria-label="전송"
        >
          <SendHorizonal size={14} />
        </button>
      </div>
    </div>
  )
}
