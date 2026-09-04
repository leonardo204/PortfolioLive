import { getPortfolioSections } from '@/lib/queries/portfolio'
import { FeaturedProjects } from '@/components/portfolio/featured-projects'
import { AppShowcase } from '@/components/portfolio/app-showcase'
import { ProjectList } from '@/components/portfolio/project-list'
import { getTranslations } from 'next-intl/server'

interface Props {
  locale: string
}

/** 구역 사이를 가르는 작은 제목. 선 하나로 끊어 읽는 흐름을 만든다. */
function SubHeading({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-4 mb-6 md:mb-8">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#586065] shrink-0">
        {label}
      </h3>
      {typeof count === 'number' && (
        <span className="text-[11px] font-mono text-[#abb3b9] tabular-nums shrink-0">
          {count}
        </span>
      )}
      <div className="h-px flex-grow bg-[#abb3b9]/15" />
    </div>
  )
}

export async function PortfolioSection({ locale }: Props) {
  const t = await getTranslations('portfolio')
  const { featured, apps, all } = await getPortfolioSections(locale)

  return (
    <section
      id="portfolio"
      className="max-w-7xl mx-auto px-6 md:px-8 mb-32 md:mb-40"
    >
      {/* 영역 제목 */}
      <div className="flex items-center gap-6 mb-12 md:mb-16">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#586065] flex-shrink-0">
          Portfolio
        </h2>
        <div className="h-px flex-grow bg-[#abb3b9]/20" />
      </div>

      {/* 1. 대표작 — 가장 먼저 보여줄 것 */}
      {featured.length > 0 && (
        <div className="mb-20 md:mb-24">
          <SubHeading label={t('featured')} />
          <FeaturedProjects projects={featured} locale={locale} />
        </div>
      )}

      {/* 2. App Store에 올린 앱 — 바탕색을 달리해 다른 묶음임을 드러낸다 */}
      {apps.length > 0 && (
        <div className="mb-20 md:mb-24 bg-[#f1f4f7] rounded-2xl p-6 md:p-10">
          <SubHeading label={t('apps')} count={apps.length} />
          <AppShowcase projects={apps} locale={locale} />
        </div>
      )}

      {/* 3. 전체 목록 */}
      <div>
        <SubHeading label={t('allProjects')} count={all.length} />
        <ProjectList projects={all} locale={locale} />
      </div>
    </section>
  )
}
