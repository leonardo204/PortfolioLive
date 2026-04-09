'use client'

import { ProjectTable } from './project-table'
import { TechStackTable } from './tech-stack-table'
import { CareerTimeline } from './career-timeline'
import { ComparisonTable } from './comparison-table'
import { ContactForm } from './contact-form'
import { ProjectRefCard } from './project-ref-card'
import { DiagramCard } from './diagram-card'
import { SkillMatrix } from './skill-matrix'
import { TimelineCard } from './timeline-card'

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
    case 'project-ref-card':
      return <ProjectRefCard data={data} />
    case 'diagram-card':
      return <DiagramCard data={data} />
    case 'skill-matrix':
      return <SkillMatrix data={data} />
    case 'timeline-card':
      return <TimelineCard data={data} />
    default:
      return null
  }
}

export { ProjectTable } from './project-table'
export { TechStackTable } from './tech-stack-table'
export { CareerTimeline } from './career-timeline'
export { ComparisonTable } from './comparison-table'
export { ContactForm } from './contact-form'
export { ProjectRefCard } from './project-ref-card'
export { DiagramCard } from './diagram-card'
export { SkillMatrix } from './skill-matrix'
export { TimelineCard } from './timeline-card'
