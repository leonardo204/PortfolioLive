'use client'

import { useLocale } from 'next-intl'

interface TimelineCardData {
  company: string
  period: string
  role: string
  department?: string
  highlights?: string[]
}

interface TimelineCardProps {
  data: unknown
}

function SingleCard({ card }: { card: TimelineCardData }) {
  return (
    <div className="px-4 py-3 mx-4 my-2 bg-[#f8f9fb] rounded-lg">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-[#2b3438] leading-snug">
          {card.company}
        </span>
        <span className="text-xs text-[#586065] flex-shrink-0">{card.period}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-[#0053db]">{card.role}</span>
        {card.department && (
          <>
            <span className="text-xs text-[#abb3b9]">·</span>
            <span className="text-xs text-[#586065]">{card.department}</span>
          </>
        )}
      </div>
      {card.highlights && card.highlights.length > 0 && (
        <ul className="space-y-1">
          {card.highlights.filter(h => typeof h === 'string' && h.trim()).map((item, i) => (
            <li key={i} className="text-xs text-[#586065] flex items-start gap-1.5">
              <span className="text-[#0053db] mt-px flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function TimelineCard({ data }: TimelineCardProps) {
  const locale = useLocale()

  const cards: TimelineCardData[] = Array.isArray(data)
    ? (data as TimelineCardData[])
    : data && typeof data === 'object'
      ? [data as TimelineCardData]
      : []

  if (cards.length === 0) return null

  return (
    <div className="my-3 rounded-xl border border-[#eaeef2] bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-[#f8f9fb] border-b border-[#eaeef2]">
        <span className="text-xs font-semibold text-[#586065] uppercase tracking-wide">
          {locale === 'en' ? 'Career Highlight' : '경력 하이라이트'}
        </span>
      </div>
      <div className="py-2">
        {cards.map((card, i) => (
          <SingleCard key={card.company ?? i} card={card} />
        ))}
      </div>
    </div>
  )
}
