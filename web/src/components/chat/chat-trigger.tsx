'use client'

import { useTranslations } from 'next-intl'
import { MessageSquare } from 'lucide-react'

interface ChatTriggerProps {
  onClick?: () => void
  isOpen?: boolean
}

export function ChatTrigger({ onClick, isOpen }: ChatTriggerProps) {
  const t = useTranslations('chat')

  if (isOpen) return null

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl cursor-pointer"
      aria-label="채팅 열기"
    >
      <MessageSquare size={18} className="text-blue-400" />
      <span className="text-sm font-medium hidden sm:inline">
        {t('trigger')}
      </span>
    </button>
  )
}
