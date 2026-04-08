import { CompanyBadge } from './company-badge'

interface CompanyCardProps {
  career: {
    id: number
    company: string
    companyType: string
    department: string
    position: string
    location: string
    startedAt: Date
    endedAt: Date | null
    isCurrent: boolean
    techTransition: string | null
    summary: string | null
  }
  isCurrent: boolean
  locale?: string
}

function calcDuration(startedAt: Date, endedAt: Date | null, locale: string = 'ko'): string {
  const end = endedAt ?? new Date()
  const diffMs = end.getTime() - startedAt.getTime()
  const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44))
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  if (locale === 'en') {
    if (years === 0) return `${months} mos`
    if (months === 0) return `${years} yrs`
    return `${years} yrs ${months} mos`
  }

  if (years === 0) return `${months}개월`
  if (months === 0) return `${years}년`
  return `${years}년 ${months}개월`
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}.${m}`
}

export function CompanyCard({ career, isCurrent, locale = 'ko' }: CompanyCardProps) {
  const startDate = new Date(career.startedAt)
  const endDate = career.endedAt ? new Date(career.endedAt) : null
  const duration = calcDuration(startDate, endDate, locale)
  const currentLabel = locale === 'en' ? 'Present' : '현재'
  const periodStr = `${formatDate(startDate)} — ${endDate ? formatDate(endDate) : currentLabel}`

  return (
    <div className="group">
      {/* Header: 회사명 + 뱃지 + 기간 */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-bold text-[#2b3438]">{career.company}</h3>
            <CompanyBadge companyType={career.companyType} locale={locale} />
          </div>
          <p className="font-mono text-sm text-[#586065]">
            {career.department} · {career.position} · {career.location}
          </p>
        </div>
        <div className="md:text-right flex-shrink-0">
          <span className="text-sm font-bold text-[#2b3438]">{periodStr}</span>
          <span
            className={`block text-xs font-mono uppercase tracking-widest mt-1 ${
              isCurrent ? 'text-[#0053db]/70' : 'text-[#586065]/60'
            }`}
          >
            {duration}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 md:p-8 rounded-xl bg-[#f1f4f7] hover:bg-white hover:shadow-[0px_12px_32px_rgba(43,52,56,0.04)] transition-all duration-300 border border-transparent hover:border-[#c7d3ff]/30">
        {/* Tech Transition */}
        {career.techTransition && (
          <p className="text-base md:text-lg text-[#2b3438] mb-6">{career.techTransition}</p>
        )}

        {/* Summary */}
        {career.summary && (
          <p className="text-sm text-[#586065] mt-2">{career.summary}</p>
        )}
      </div>
    </div>
  )
}
