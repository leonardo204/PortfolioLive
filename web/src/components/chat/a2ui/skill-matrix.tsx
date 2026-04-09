'use client'

import { useLocale } from 'next-intl'

interface Skill {
  name: string
  level: number // 1-5
}

interface SkillCategory {
  name: string
  skills: Skill[]
}

interface SkillMatrixData {
  categories: SkillCategory[]
}

interface SkillMatrixProps {
  data: unknown
}

function SkillDots({ level }: { level: number }) {
  const clamped = Math.max(1, Math.min(5, level))
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: i < clamped ? '#0053db' : '#eaeef2' }}
        />
      ))}
    </span>
  )
}

export function SkillMatrix({ data }: SkillMatrixProps) {
  const locale = useLocale()

  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  const matrix = data as SkillMatrixData

  if (!Array.isArray(matrix.categories) || matrix.categories.length === 0) return null

  return (
    <div className="my-3 rounded-xl border border-[#eaeef2] bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-[#f8f9fb] border-b border-[#eaeef2]">
        <span className="text-xs font-semibold text-[#586065] uppercase tracking-wide">
          {locale === 'en' ? 'Skill Matrix' : '기술 역량'}
        </span>
      </div>
      <div className="divide-y divide-[#eaeef2]">
        {matrix.categories.map((category, ci) => (
          <div key={category.name ?? ci} className="px-4 py-3">
            <p className="text-xs font-semibold text-[#2b3438] mb-2">{category.name}</p>
            <div className="space-y-1.5">
              {Array.isArray(category.skills) && category.skills.map((skill, si) => (
                <div key={skill.name ?? si} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-[#586065]">{skill.name}</span>
                  <SkillDots level={skill.level} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
