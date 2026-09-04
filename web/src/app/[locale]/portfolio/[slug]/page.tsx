import type { Metadata } from 'next'
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
import { JsonLd } from '@/components/seo/json-ld'
import { projectGraph } from '@/lib/structured-data'
import { SITE_URL, metaFor, alternatesFor } from '@/lib/site'

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

// 이 화면은 요청이 올 때마다 서버에서 만든다.
// next-intl이 요청 정보를 읽기 때문에 미리 만들어 둘 수 없다.
// 대신 아래 unstable_cache가 데이터베이스 조회 결과를 한 시간 동안 다시 쓴다.
export const dynamic = 'force-dynamic'

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const meta = metaFor(locale)
  const pagePath = `/portfolio/${slug}`
  const canonical = `${SITE_URL}/${locale}${pagePath}`

  try {
    const project = await prisma.portfolioProject.findUnique({
      where: { slug },
      select: { title: true, titleEn: true, description: true, descriptionEn: true },
    })
    if (!project) return { title: 'Not Found' }

    const title = locale === 'en' ? project.titleEn || project.title : project.title
    const description =
      (locale === 'en' ? project.descriptionEn || project.description : project.description) ||
      meta.description
    // 위 폴더의 제목 서식(%s | 이용섭)이 자동으로 붙으므로 여기서는 이름을 다시 적지 않는다.
    const fullTitle = `${title} | ${meta.siteName}`

    return {
      metadataBase: new URL(SITE_URL),
      title,
      description,
      alternates: {
        canonical,
        languages: alternatesFor(pagePath),
      },
      openGraph: {
        type: 'article',
        url: canonical,
        siteName: meta.siteName,
        title: fullTitle,
        description,
        locale: locale === 'en' ? 'en_US' : 'ko_KR',
        images: [
          {
            url: '/opengraph-image',
            width: 1200,
            height: 630,
            alt: meta.ogAlt,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: fullTitle,
        description,
        images: ['/opengraph-image'],
      },
    }
  } catch {
    return { title: meta.siteName }
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
    <JsonLd data={projectGraph({ ...project, title, description }, locale)} />
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
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#eaeef2] hover:bg-[#e2e9ee] text-[#586065] text-xs font-bold uppercase tracking-widest rounded-full transition-colors"
              >
                GitHub
              </a>
            )}
            {project.appStoreUrl && (
              <a
                href={project.appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0053db] hover:bg-[#0048bf] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-colors"
              >
                App Store
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-colors ${
                  project.appStoreUrl
                    ? 'bg-[#dbe1ff] hover:bg-[#c7d3ff] text-[#0048bf]'
                    : 'bg-[#0053db] hover:bg-[#0048bf] text-white'
                }`}
              >
                {locale === 'en' ? 'Visit Live Site' : '서비스 바로가기'}
              </a>
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
