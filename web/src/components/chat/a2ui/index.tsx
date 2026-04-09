'use client'

import { ProjectTable } from './project-table'
import { TechStackTable } from './tech-stack-table'
import { CareerTimeline } from './career-timeline'
import { ComparisonTable } from './comparison-table'
import { ContactForm } from './contact-form'

interface A2UIRendererProps {
  component: string
  data: unknown
  sessionId?: number | null
}

/**
 * A2UI 타입별 렌더러 레지스트리
 * 알 수 없는 타입은 null 반환 (graceful fallback)
 */
export function A2UIRenderer({ component, data, sessionId }: A2UIRendererProps) {
  switch (component) {
    case 'project-table':
      return <ProjectTable data={data} />
    case 'tech-stack-table':
      return <TechStackTable data={data} />
    case 'career-timeline':
      return <CareerTimeline data={data} />
    case 'comparison-table':
      return <ComparisonTable data={data} />
    case 'contact-form':
      return <ContactForm data={data} sessionId={sessionId} />
    default:
      return null
  }
}

export { ProjectTable } from './project-table'
export { TechStackTable } from './tech-stack-table'
export { CareerTimeline } from './career-timeline'
export { ComparisonTable } from './comparison-table'
export { ContactForm } from './contact-form'
