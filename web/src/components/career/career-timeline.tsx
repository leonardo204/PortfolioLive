import { CompanyCard } from './company-card'
import type { CareerWithProjects } from '@/lib/queries/career'

interface CareerTimelineProps {
  careers: CareerWithProjects[]
  locale: string
}

export function CareerTimeline({ careers, locale }: CareerTimelineProps) {
  if (careers.length === 0) {
    return (
      <div className="py-16 text-center text-[#586065]">
        <p className="text-sm">
          {locale === 'en' ? 'Loading career data...' : '경력 데이터를 불러오는 중입니다.'}
        </p>
      </div>
    )
  }

  return (
    <div className="relative pl-10 md:pl-12 border-l border-[#abb3b9]/20 ml-2 md:ml-4 space-y-14 md:space-y-16">
      {careers.map((career) => (
        <div key={career.id} className="relative">
          {/* Timeline Dot */}
          <div
            className={`absolute -left-[41px] md:-left-[53px] top-1.5 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full ring-4 ring-[#f8f9fb] ${
              career.isCurrent ? 'bg-[#0053db]' : 'bg-[#abb3b9]'
            }`}
          />
          <CompanyCard career={career} isCurrent={career.isCurrent} locale={locale} />
        </div>
      ))}
    </div>
  )
}
