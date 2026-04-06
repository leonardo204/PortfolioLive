'use client'

import { MessageSquare } from 'lucide-react'

interface ChatTriggerProps {
  onClick?: () => void
  isOpen?: boolean
}

export function ChatTrigger({ onClick, isOpen }: ChatTriggerProps) {
  if (isOpen) return null

  return (
    <div className="fixed bottom-0 left-0 w-full z-40">
      <button
        onClick={onClick}
        className="w-full h-12 bg-gray-900 text-white flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors shadow-[0_-4px_20px_rgba(0,0,0,0.2)] cursor-pointer"
        aria-label="채팅 열기"
      >
        <MessageSquare size={16} className="text-blue-400" />
        <span className="font-mono text-xs font-bold uppercase tracking-[0.15em]">
          궁금한 점이 있으신가요?
        </span>
      </button>
    </div>
  )
}
