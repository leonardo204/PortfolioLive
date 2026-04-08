import Link from 'next/link'
import type { PortfolioProjectItem } from '@/lib/queries/portfolio'

interface PortfolioCardProps {
  project: PortfolioProjectItem
  locale?: string
}

export function PortfolioCard({ project, locale = 'ko' }: PortfolioCardProps) {
  return (
    <Link
      href={`/${locale}/portfolio/${project.slug}`}
      className="group block p-6 md:p-8 rounded-xl bg-white border border-[#abb3b9]/15 hover:shadow-[0px_12px_32px_rgba(43,52,56,0.04)] hover:border-[#c7d3ff]/40 transition-all duration-300"
    >
      {/* Category */}
      {project.category && (
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#abb3b9] mb-3 block">
          {project.category}
        </span>
      )}

      {/* Title */}
      <h4 className="text-lg font-bold text-[#2b3438] mb-3 group-hover:text-[#0053db] transition-colors leading-tight">
        {project.title}
      </h4>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-[#586065] mb-5 leading-relaxed line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Tech Badges */}
      {(project.technologies ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(project.technologies ?? []).slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="text-[10px] font-mono font-bold px-2 py-1 bg-[#eaeef2] text-[#586065] rounded uppercase tracking-tight"
            >
              {tech}
            </span>
          ))}
          {(project.technologies ?? []).length > 5 && (
            <span className="text-[10px] font-mono font-bold px-2 py-1 bg-[#eaeef2] text-[#abb3b9] rounded uppercase tracking-tight">
              +{(project.technologies ?? []).length - 5}
            </span>
          )}
        </div>
      )}

      {/* Year */}
      {project.year && (
        <span className="text-[10px] font-mono text-[#abb3b9] uppercase tracking-widest">
          {project.year}
        </span>
      )}
    </Link>
  )
}
