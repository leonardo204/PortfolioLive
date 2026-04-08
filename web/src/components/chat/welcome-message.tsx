'use client'

import { useTranslations } from 'next-intl'

export function WelcomeMessage() {
  const t = useTranslations('chat')
  const welcome = t('welcome')

  return (
    <div className="flex flex-col items-start gap-2 max-w-[85%]">
      <div className="bg-[#f1f4f7] text-[#2b3438] p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed border border-[#eaeef2]">
        {welcome.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < welcome.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  )
}
