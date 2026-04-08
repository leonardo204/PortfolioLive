'use client'

interface CareerEntry {
  company: string
  period: string
  role: string
  highlight?: string
}

interface CareerTimelineProps {
  data: unknown
}

export function CareerTimeline({ data }: CareerTimelineProps) {
  if (!Array.isArray(data) || data.length === 0) return null

  const entries = data as CareerEntry[]

  return (
    <div className="my-3 rounded-xl border border-[#eaeef2] bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-[#f8f9fb] border-b border-[#eaeef2]">
        <span className="text-xs font-semibold text-[#586065] uppercase tracking-wide">경력 타임라인</span>
      </div>
      <div className="px-4 py-3">
        <div className="relative">
          {/* 타임라인 세로선 */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#eaeef2]" />

          <div className="space-y-4">
            {entries.map((entry, i) => (
              <div key={i} className="flex gap-4 relative">
                {/* 타임라인 점 */}
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-[#0053db] border-2 border-white shadow-sm mt-0.5 z-10" />

                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-[#2b3438]">{entry.company}</span>
                    <span className="text-xs text-[#586065]">{entry.period}</span>
                  </div>
                  <div className="text-xs text-[#0053db] font-medium mb-1">{entry.role}</div>
                  {entry.highlight && (
                    <p className="text-xs text-[#586065] leading-relaxed">{entry.highlight}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
