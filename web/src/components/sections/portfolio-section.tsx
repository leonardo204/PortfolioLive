import { getPortfolioProjects } from '@/lib/queries/portfolio'
import { FilterBar } from '@/components/portfolio/filter-bar'

interface Props {
  locale: string
}

export async function PortfolioSection({ locale }: Props) {
  const projects = await getPortfolioProjects(locale)

  return (
    <section
      id="portfolio"
      className="max-w-7xl mx-auto px-6 md:px-8 mb-32 md:mb-40"
    >
      {/* Section Header */}
      <div className="flex items-center gap-6 mb-12 md:mb-16">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#586065] flex-shrink-0">
          Portfolio
        </h2>
        <div className="h-px flex-grow bg-[#abb3b9]/20" />
      </div>

      {/* Filter + Grid */}
      <FilterBar projects={projects} locale={locale} />
    </section>
  )
}
