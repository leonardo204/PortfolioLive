import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { PortfolioContent } from '@/components/portfolio/portfolio-content'
import { ChatWrapper } from '@/components/chat/chat-wrapper'

export const dynamic = 'force-dynamic'

/**
 * README의 "스크린샷 추가 예정" 플레이스홀더를
 * public/images/portfolio/{slug}-*.png static 파일로 교체
 */
function injectStaticScreenshots(markdown: string, slug: string): string {
  const imgDir = path.join(process.cwd(), 'public/images/portfolio')
  let files: string[] = []
  try {
    files = fs.readdirSync(imgDir)
      .filter((f) => f.startsWith(`${slug}-`) && /\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort()
  } catch { /* 디렉토리 없으면 무시 */ }

  if (files.length === 0) return markdown

  const imagesMd = files
    .map((f) => `![${f.replace(/\.[^.]+$/, '').replace(`${slug}-`, '').replace(/-/g, ' ')}](/images/portfolio/${f})`)
    .join('\n\n')

  // "스크린샷 추가 예정" 플레이스홀더 교체
  const replaced = markdown.replace(/>\s*스크린샷 추가 예정/g, imagesMd)
  if (replaced !== markdown) return replaced

  // 플레이스홀더가 없으면 ## 스크린샷 섹션 뒤에 삽입
  return markdown.replace(/(## 스크린샷\s*\n)/, `$1\n${imagesMd}\n\n`)
}

export const revalidate = 3600

const getProject = unstable_cache(
  async (slug: string) => {
    return prisma.portfolioProject.findUnique({ where: { slug } })
  },
  ['portfolio-project'],
  { revalidate: 3600 }
)

interface Props {
  params: Promise<{ locale: string; slug: string }>
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
  const { slug, locale } = await params
  try {
    const project = await prisma.portfolioProject.findUnique({
      where: { slug },
      select: { title: true, titleEn: true, description: true, descriptionEn: true },
    })
    if (!project) return { title: 'Not Found' }
    const title = locale === 'en' ? (project.titleEn || project.title) : project.title
    const description = locale === 'en' ? (project.descriptionEn || project.description) : project.description
    return {
      title: `${title} | ${locale === 'en' ? 'Yongsub Lee Portfolio' : '이용섭 포트폴리오'}`,
      description,
    }
  } catch {
    return { title: 'Portfolio' }
  }
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { slug, locale } = await params
  const t = await getTranslations('portfolio')

  let project
  try {
    project = await getProject(slug)
  } catch {
    notFound()
  }

  if (!project) notFound()

  const title = locale === 'en' ? (project.titleEn || project.title) : project.title
  const description = locale === 'en' ? (project.descriptionEn || project.description) : project.description
  const readmeRaw = locale === 'en' ? (project.readmeRawEn || project.readmeRaw) : project.readmeRaw

  return (
    <>
    <main className="min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#f8f9fb]/80 backdrop-blur-md border-b border-[#abb3b9]/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href={`/${locale}/#portfolio`}
            className="flex items-center gap-2 text-sm text-[#586065] hover:text-[#0053db] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{t('back')}</span>
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
            {title}
          </h1>
          {description && (
            <p className="text-lg text-[#586065] leading-relaxed max-w-2xl">
              {description}
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
        {readmeRaw ? (
          <PortfolioContent
            markdown={injectStaticScreenshots(readmeRaw, project.slug)}
            slug={project.slug}
          />
        ) : (
          <div className="text-center py-20 text-[#abb3b9]">
            <p className="text-lg">{t('preparing')}</p>
          </div>
        )}
      </article>
    </main>
    <ChatWrapper />
    </>
  )
}
