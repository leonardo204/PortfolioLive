'use client'

interface ProjectRow {
  slug: string
  title: string
  description?: string
  techs?: string[]
}

interface ProjectTableProps {
  data: unknown
}

export function ProjectTable({ data }: ProjectTableProps) {
  // graceful fallback
  if (!Array.isArray(data) || data.length === 0) {
    return null
  }

  const projects = data as ProjectRow[]

  return (
    <div className="my-3 rounded-xl border border-[#eaeef2] bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-[#f8f9fb] border-b border-[#eaeef2]">
        <span className="text-xs font-semibold text-[#586065] uppercase tracking-wide">프로젝트</span>
      </div>
      <div className="divide-y divide-[#eaeef2]">
        {projects.map((project, i) => (
          <div key={project.slug ?? i} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-[#2b3438] leading-snug">
                {project.title}
              </span>
            </div>
            {project.description && (
              <p className="text-xs text-[#586065] leading-relaxed mb-2">
                {project.description}
              </p>
            )}
            {project.techs && project.techs.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.techs.slice(0, 5).map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 text-xs rounded-full bg-[#dbe1ff] text-[#0048bf] font-medium"
                  >
                    {tech}
                  </span>
                ))}
                {project.techs.length > 5 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-[#f1f4f7] text-[#586065]">
                    +{project.techs.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
