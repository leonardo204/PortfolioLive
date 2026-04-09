'use client'

import { useLocale } from 'next-intl'
import { MermaidDiagram } from '@/components/portfolio/mermaid-diagram'

interface DiagramData {
  title?: string
  mermaidCode: string
}

interface DiagramCardProps {
  data: unknown
}

export function DiagramCard({ data }: DiagramCardProps) {
  const locale = useLocale()

  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  const diagram = data as DiagramData

  if (!diagram.mermaidCode || typeof diagram.mermaidCode !== 'string' ||
      diagram.mermaidCode.trim().length === 0 || diagram.mermaidCode.length > 10000) return null

  const header = diagram.title ?? (locale === 'en' ? 'Architecture' : '아키텍처')

  return (
    <div className="my-3 rounded-xl border border-[#eaeef2] bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-[#f8f9fb] border-b border-[#eaeef2]">
        <span className="text-xs font-semibold text-[#586065] uppercase tracking-wide">
          {header}
        </span>
      </div>
      <div className="px-4 py-3">
        <MermaidDiagram chart={diagram.mermaidCode} />
      </div>
    </div>
  )
}
