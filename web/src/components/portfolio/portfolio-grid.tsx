import { PortfolioCard } from './portfolio-card'
import type { PortfolioProjectItem } from '@/lib/queries/portfolio'
import { useTranslations } from 'next-intl'

interface PortfolioGridProps {
  projects: PortfolioProjectItem[]
  locale?: string
}

export function PortfolioGrid({ projects, locale = 'ko' }: PortfolioGridProps) {
  if (projects.length === 0) {
    return (
      <div className="py-16 text-center text-[#586065]">
        <p className="text-sm">
          {locale === 'en' ? 'Loading portfolio data...' : '포트폴리오 데이터를 불러오는 중입니다.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {projects.map((project) => (
        <PortfolioCard key={project.id} project={project} locale={locale} />
      ))}
    </div>
  )
}
