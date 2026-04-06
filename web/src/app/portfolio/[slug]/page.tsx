import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PortfolioContent } from '@/components/portfolio/portfolio-content'

export const revalidate = 3600 // ISR 1시간

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const projects = await prisma.portfolioProject.findMany({
      select: { slug: true },
    })
    return projects.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  try {
    const project = await prisma.portfolioProject.findUnique({
      where: { slug },
      select: { title: true, description: true },
    })
    if (!project) return { title: 'Not Found' }
    return {
      title: `${project.title} | 이용섭 포트폴리오`,
      description: project.description,
    }
  } catch {
    return { title: 'Portfolio' }
  }
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { slug } = await params

  let project
  try {
    project = await prisma.portfolioProject.findUnique({
      where: { slug },
    })
  } catch {
    notFound()
  }

  if (!project) notFound()

  return (
    <main className="min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#f8f9fb]/80 backdrop-blur-md border-b border-[#abb3b9]/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/#portfolio"
            className="flex items-center gap-2 text-sm text-[#586065] hover:text-[#0053db] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>돌아가기</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Title Area */}
        <div className="mb-12">
          {project.category && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#abb3b9] mb-3 block">
              {project.category}
            </span>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#2b3438] mb-4">
            {project.title}
          </h1>
          {project.description && (
            <p className="text-lg text-[#586065] leading-relaxed max-w-2xl">
              {project.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            {project.year && (
              <span className="text-xs font-mono text-[#abb3b9] uppercase tracking-widest">
                {project.year}
              </span>
            )}
            {project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="text-[10px] font-mono font-bold px-2 py-1 bg-[#eaeef2] text-[#586065] rounded uppercase tracking-tight"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* README Content */}
        {project.readmeRaw ? (
          <PortfolioContent markdown={project.readmeRaw} />
        ) : (
          <div className="text-center py-20 text-[#abb3b9]">
            <p className="text-lg">상세 정보를 준비 중입니다.</p>
          </div>
        )}
      </article>
    </main>
  )
}
