import Link from 'next/link'
import { initialsOf } from '@/lib/project-visual'
import { StatusBadge } from './status-badge'
import type { PortfolioListItem } from '@/lib/queries/portfolio'

interface Props {
  projects: PortfolioListItem[]
  locale: string
}

/**
 * 대표작. 첫 화면에서 가장 먼저 눈에 들어와야 하는 자리다.
 * 나머지 목록보다 카드를 크게 잡고 설명도 더 길게 보여준다.
 * 어느 프로젝트를 여기 올릴지는 관리 화면에서 정한다.
 */
export function FeaturedProjects({ projects, locale }: Props) {
  if (projects.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/${locale}/portfolio/${project.slug}`}
          className="group flex flex-col p-7 md:p-9 rounded-2xl bg-white hover:shadow-[0px_12px_32px_rgba(43,52,56,0.06)] transition-all duration-300 ring-1 ring-transparent hover:ring-[#c7d3ff]/50"
        >
          <div className="flex items-start gap-5 mb-6">
            {/* 썸네일 대신 제목에서 딴 약칭 */}
            <span
              aria-hidden="true"
              className="shrink-0 grid place-items-center w-14 h-14 rounded-xl bg-[#f1f4f7] text-[#586065] font-mono font-bold text-base tracking-tight group-hover:bg-[#dbe1ff] group-hover:text-[#0048bf] transition-colors"
            >
              {initialsOf(project.title)}
            </span>

            <div className="min-w-0">
              <h4 className="text-xl md:text-2xl font-bold text-[#2b3438] leading-tight group-hover:text-[#0053db] transition-colors">
                {project.title}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {project.appStoreUrl && (
                  <StatusBadge tone="accent">App Store</StatusBadge>
                )}
                {project.year && (
                  <span className="text-[10px] font-mono text-[#abb3b9] uppercase tracking-widest">
                    {project.year}
                  </span>
                )}
              </div>
            </div>
          </div>

          {project.description && (
            <p className="text-sm md:text-[0.95rem] text-[#586065] leading-relaxed line-clamp-3 mb-7">
              {project.description}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-1.5">
            {(project.technologies ?? []).slice(0, 6).map((tech) => (
              <span
                key={tech}
                className="text-[10px] font-mono font-bold px-2 py-1 bg-[#f1f4f7] text-[#586065] rounded uppercase tracking-tight"
              >
                {tech}
              </span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  )
}
