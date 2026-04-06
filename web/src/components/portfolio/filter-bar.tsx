'use client'

import { useState } from 'react'
import { PortfolioGrid } from './portfolio-grid'
import type { PortfolioProjectItem } from '@/lib/queries/portfolio'

const FILTERS = [
  { label: '전체', value: '' },
  { label: 'AI & Voice', value: 'AI & Voice' },
  { label: 'STB', value: 'STB' },
  { label: '사이드 프로젝트', value: '사이드 프로젝트' },
]

interface FilterBarProps {
  projects: PortfolioProjectItem[]
}

export function FilterBar({ projects }: FilterBarProps) {
  const [activeFilter, setActiveFilter] = useState('')

  const filtered =
    activeFilter === ''
      ? projects
      : projects.filter((p) => p.category === activeFilter)

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
      <PortfolioGrid projects={filtered} />
    </div>
  )
}
