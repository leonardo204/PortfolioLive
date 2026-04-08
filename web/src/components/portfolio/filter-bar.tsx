'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PortfolioGrid } from './portfolio-grid'
import type { PortfolioProjectItem } from '@/lib/queries/portfolio'

interface FilterBarProps {
  projects: PortfolioProjectItem[]
  locale?: string
}

export function FilterBar({ projects, locale = 'ko' }: FilterBarProps) {
  const t = useTranslations('portfolio')
  const [activeFilter, setActiveFilter] = useState('')

  const FILTERS = [
    { label: t('all'), value: '' },
    { label: t('aiVoice'), value: 'AI & Voice' },
    { label: t('stb'), value: 'STB Middleware' },
    { label: t('sideProjects'), value: 'Side Projects' },
  ]

  const filtered =
    activeFilter === ''
      ? projects
      : projects.filter((p) => p.category?.includes(activeFilter))

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-10 md:mb-12">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.value
          return (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                isActive
                  ? 'bg-[#dbe1ff] text-[#0048bf]'
                  : 'text-[#586065] hover:bg-[#e2e9ee]'
              }`}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <PortfolioGrid projects={filtered} locale={locale} />
    </div>
  )
}
