'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { StatusBadge } from './status-badge'
import type { PortfolioListItem } from '@/lib/queries/portfolio'

interface Props {
  projects: PortfolioListItem[]
  locale: string
}

/**
 * 전체 프로젝트 목록.
 *
 * 대표작·앱과 달리 수가 많아 카드로 늘어놓으면 어디를 봐야 할지 알기 어렵다.
 * 그래서 한 줄에 하나씩, 왼쪽에 연도를 세워 훑어 내려가기 좋게 했다.
 */
export function ProjectList({ projects, locale }: Props) {
  const t = useTranslations('portfolio')
  const [activeFilter, setActiveFilter] = useState('')

  const en = locale === 'en'

  const FILTERS = [
    { label: t('all'), value: '' },
    { label: t('aiVoice'), value: 'AI & Voice' },
    { label: t('stb'), value: 'STB Middleware' },
    { label: t('sideProjects'), value: 'Side Projects' },
  ]

  const filtered = projects.filter((p) => {
    if (activeFilter && !p.category?.includes(activeFilter)) return false
    return true
  })

  return (
    <div>
      {/* 분류 단추 + 지금 몇 개가 보이는지 */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.value
          return (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                isActive
                  ? 'bg-[#dbe1ff] text-[#0048bf]'
                  : 'text-[#586065] hover:bg-[#eaeef2]'
              }`}
            >
              {filter.label}
            </button>
          )
        })}

        <span className="ml-auto text-xs font-mono text-[#abb3b9] tabular-nums">
          {en
            ? `${filtered.length} of ${projects.length}`
            : `${projects.length}개 중 ${filtered.length}개`}
        </span>
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-[#586065]">
          {en ? 'No projects match this filter.' : '조건에 맞는 프로젝트가 없습니다.'}
        </p>
      ) : (
        <ul className="border-t border-[#abb3b9]/15">
          {filtered.map((project) => (
            <li key={project.id} className="border-b border-[#abb3b9]/15">
              <Link
                href={`/${locale}/portfolio/${project.slug}`}
                className="group grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-5 px-2 -mx-2 rounded-lg hover:bg-white transition-colors duration-200"
              >
                {/* 연도 — 훑어 내려갈 때 기준점이 된다 */}
                <span className="sm:col-span-2 text-[11px] font-mono text-[#abb3b9] uppercase tracking-widest sm:pt-1 tabular-nums">
                  {project.year ?? '—'}
                </span>

                <div className="sm:col-span-10 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mb-1">
                    <h4 className="text-base font-bold text-[#2b3438] group-hover:text-[#0053db] transition-colors leading-tight">
                      {project.title}
                    </h4>
                    {project.appStoreUrl && (
                      <StatusBadge tone="accent">App Store</StatusBadge>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-sm text-[#586065] leading-relaxed line-clamp-2 mb-2.5">
                      {project.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {(project.technologies ?? []).slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#eaeef2] text-[#586065] rounded uppercase tracking-tight"
                      >
                        {tech}
                      </span>
                    ))}
                    {(project.technologies ?? []).length > 4 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 text-[#abb3b9]">
                        +{(project.technologies ?? []).length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
