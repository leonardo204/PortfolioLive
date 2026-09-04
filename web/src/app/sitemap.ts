import type { MetadataRoute } from 'next'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { SITE_URL, LOCALES, alternatesFor } from '@/lib/site'

// 도커 빌드 시점에는 데이터베이스가 없어 프로젝트 목록을 읽을 수 없다.
// 그때 만들어 두면 홈 주소 두 개짜리 빈 사이트맵이 굳어 버리므로,
// 요청이 올 때 만든다. 대신 데이터베이스 조회 결과는 한 시간 동안 다시 쓴다.
export const dynamic = 'force-dynamic'

type ProjectRow = { slug: string; updatedAt: Date }

const loadProjects = unstable_cache(
  async (): Promise<ProjectRow[]> => {
    try {
      return await prisma.portfolioProject.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
      })
    } catch {
      // 데이터베이스에 닿지 못하면 홈 주소만이라도 내보낸다.
      return []
    }
  },
  ['sitemap-projects'],
  { revalidate: 3600 }
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await loadProjects()
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const locale of LOCALES) {
    entries.push({
      url: `${SITE_URL}/${locale}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: { languages: alternatesFor('/') },
    })
  }

  for (const project of projects) {
    const path = `/portfolio/${project.slug}`
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: project.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: { languages: alternatesFor(path) },
      })
    }
  }

  return entries
}
