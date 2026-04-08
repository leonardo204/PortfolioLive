'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, GitBranch } from 'lucide-react'

interface ProjectData {
  id: number
  slug: string
  title: string
  description: string
  techStack: string[]
  githubUrl?: string
  liveUrl?: string
}

interface ProjectRefCardProps {
  slug: string
}

export function ProjectRefCard({ slug }: ProjectRefCardProps) {
  const [project, setProject] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/v1/admin/projects?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        // API가 배열 또는 단일 객체를 반환할 수 있음
        const item = Array.isArray(data) ? data.find((p: ProjectData) => p.slug === slug) : data
        setProject(item ?? null)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="rounded-xl border border-[#eaeef2] bg-[#f8f9fb] p-4 my-2 animate-pulse">
        <div className="h-4 bg-[#eaeef2] rounded w-1/2 mb-2" />
        <div className="h-3 bg-[#eaeef2] rounded w-3/4" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="rounded-xl border border-[#eaeef2] bg-[#f8f9fb] p-4 my-2 text-sm text-[#586065]">
        프로젝트 정보를 불러올 수 없습니다: <code className="text-xs">{slug}</code>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#eaeef2] bg-white p-4 my-2 shadow-sm hover:shadow-md transition-shadow">
      {/* 제목 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-[#2b3438] leading-snug">{project.title}</h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f1f4f7] transition-colors"
              aria-label="GitHub"
            >
              <GitBranch size={14} className="text-[#586065]" />
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f1f4f7] transition-colors"
              aria-label="라이브 데모"
            >
              <ExternalLink size={14} className="text-[#586065]" />
            </a>
          )}
        </div>
      </div>

      {/* 설명 */}
      {project.description && (
        <p className="text-xs text-[#586065] leading-relaxed mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* 기술 태그 */}
      {project.techStack && project.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.techStack.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 text-xs rounded-full bg-[#dbe1ff] text-[#0048bf] font-medium"
            >
              {tech}
            </span>
          ))}
          {project.techStack.length > 5 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-[#f1f4f7] text-[#586065]">
              +{project.techStack.length - 5}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
