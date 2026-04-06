'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CompanyBadge } from './company-badge'
import type { CareerWithProjects } from '@/lib/queries/career'

interface CompanyCardProps {
  career: CareerWithProjects
  isCurrent: boolean
}

function calcDuration(startedAt: Date, endedAt: Date | null): string {
  const end = endedAt ?? new Date()
  const diffMs = end.getTime() - startedAt.getTime()
  const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44))
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  if (years === 0) return `${months}개월`
  if (months === 0) return `${years}년`
  return `${years}년 ${months}개월`
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}.${m}`
}

export function CompanyCard({ career, isCurrent }: CompanyCardProps) {
  const [open, setOpen] = useState(false)

  const startDate = new Date(career.startedAt)
  const endDate = career.endedAt ? new Date(career.endedAt) : null
  const duration = calcDuration(startDate, endDate)
  const periodStr = `${formatDate(startDate)} — ${endDate ? formatDate(endDate) : '현재'}`

  return (
    <div className="group">
      {/* Header: 회사명 + 뱃지 + 기간 */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-bold text-[#2b3438]">{career.company}</h3>
            <CompanyBadge companyType={career.companyType} />
          </div>
          <p className="font-mono text-sm text-[#586065]">
            {career.department} · {career.position} · {career.location}
          </p>
        </div>
        <div className="md:text-right flex-shrink-0">
          <span className="text-sm font-bold text-[#2b3438]">{periodStr}</span>
          <span
            className={`block text-xs font-mono uppercase tracking-widest mt-1 ${
              isCurrent ? 'text-[#0053db]/70' : 'text-[#586065]/60'
            }`}
          >
            {duration}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 md:p-8 rounded-xl bg-[#f1f4f7] hover:bg-white hover:shadow-[0px_12px_32px_rgba(43,52,56,0.04)] transition-all duration-300 border border-transparent hover:border-[#c7d3ff]/30">
        {/* Tech Transition */}
        {career.techTransition && (
          <p className="text-base md:text-lg text-[#2b3438] mb-6">{career.techTransition}</p>
        )}

        {/* Projects Accordion */}
        {career.workProjects.length > 0 && (
          <div>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-widest text-[#586065] hover:text-[#0053db] transition-colors"
            >
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{career.workProjects.length}개 프로젝트</span>
            </button>

            {open && (
              <div className="mt-4 pl-4 border-l-2 border-[#dbe1ff] space-y-3">
                {career.workProjects.map((project) => (
                  <div key={project.id}>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-xs text-[#abb3b9] mt-0.5 flex-shrink-0">
                        {project.year}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#2b3438]">{project.title}</p>
                        <p className="text-sm text-[#586065] leading-relaxed mt-0.5">
                          {project.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary (프로젝트 없을 때) */}
        {career.workProjects.length === 0 && career.summary && (
          <p className="text-base text-[#2b3438]">{career.summary}</p>
        )}
      </div>
    </div>
  )
}
