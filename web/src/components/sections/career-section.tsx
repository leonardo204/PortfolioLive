import { getCareers } from '@/lib/queries/career'
import { CareerTimeline } from '@/components/career/career-timeline'

interface Props {
  locale: string
}

export async function CareerSection({ locale }: Props) {
  const careers = await getCareers(locale)

  return (
    <section
      id="career"
      className="max-w-7xl mx-auto px-6 md:px-8 mb-32 md:mb-40"
    >
      {/* Section Header */}
      <div className="flex items-center gap-6 mb-12 md:mb-16">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#586065] flex-shrink-0">
          Career
        </h2>
        <div className="h-px flex-grow bg-[#abb3b9]/20" />
      </div>

      {/* Timeline */}
      <CareerTimeline careers={careers} locale={locale} />
    </section>
  )
}
