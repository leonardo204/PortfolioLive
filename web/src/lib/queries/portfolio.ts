import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

/** 목록·상세에서 공통으로 쓰는 필드 */
const LIST_FIELDS = {
  id: true,
  slug: true,
  title: true,
  titleEn: true,
  description: true,
  descriptionEn: true,
  category: true,
  technologies: true,
  tags: true,
  year: true,
  githubUrl: true,
  liveUrl: true,
  appStoreUrl: true,
  featured: true,
  featuredOrder: true,
  sortOrder: true,
  updatedAt: true,
} as const

type Row = {
  title: string
  titleEn: string | null
  description: string | null
  descriptionEn: string | null
}

/** 영어 화면이면 영문 필드를 앞에 세운다. 영문이 비어 있으면 한글을 그대로 쓴다. */
function localize<T extends Row>(rows: T[], locale: string): T[] {
  if (locale !== 'en') return rows
  return rows.map((r) => ({
    ...r,
    title: r.titleEn || r.title,
    description: r.descriptionEn || r.description,
  }))
}

export async function getPortfolioProjects(locale: string = 'ko') {
  try {
    const projects = await prisma.portfolioProject.findMany({
      orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }, { updatedAt: 'desc' }],
    })

    if (locale === 'en') {
      return projects.map((p) => ({
        ...p,
        title: p.titleEn || p.title,
        description: p.descriptionEn || p.description,
        readmeRaw: p.readmeRawEn || p.readmeRaw,
      }))
    }

    return projects
  } catch {
    // DB 연결 실패 시 빈 배열 반환 (빌드/개발 환경 대응)
    return []
  }
}

/**
 * 첫 화면 포트폴리오 영역에 필요한 세 묶음을 한 번에 가져온다.
 *  - featured : 대표작. 관리 화면에서 켠 것만, 지정한 순서대로.
 *  - apps     : App Store에 올린 앱. 최신 연도부터.
 *  - rest     : 나머지 전체 목록.
 * 대표작과 앱은 목록에서 빼지 않는다. 필터를 걸면 전체에서 다시 찾을 수 있어야 하기 때문이다.
 */
export async function getPortfolioSections(locale: string = 'ko') {
  try {
    const [featuredRows, appRows, allRows] = await Promise.all([
      prisma.portfolioProject.findMany({
        where: { featured: true },
        orderBy: [{ featuredOrder: 'asc' }, { sortOrder: 'asc' }],
        select: LIST_FIELDS,
      }),
      prisma.portfolioProject.findMany({
        where: { appStoreUrl: { not: null } },
        orderBy: [{ year: 'desc' }, { title: 'asc' }],
        select: LIST_FIELDS,
      }),
      prisma.portfolioProject.findMany({
        orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }, { updatedAt: 'desc' }],
        select: LIST_FIELDS,
      }),
    ])

    return {
      featured: localize(featuredRows, locale),
      apps: localize(appRows, locale),
      all: localize(allRows, locale),
    }
  } catch {
    return { featured: [], apps: [], all: [] }
  }
}

/**
 * App Store에 올린 앱 개수. 소개 문구의 {appCount} 자리에 들어간다.
 * 앱을 새로 등록하면 문구가 저절로 따라 바뀐다.
 */
export const getAppStoreCount = unstable_cache(
  async (): Promise<number> => {
    try {
      return await prisma.portfolioProject.count({
        where: { appStoreUrl: { not: null } },
      })
    } catch {
      return 0
    }
  },
  ['app-store-count'],
  { revalidate: 300 }
)

export type PortfolioProjectItem = Awaited<ReturnType<typeof getPortfolioProjects>>[number]
export type PortfolioListItem = Awaited<ReturnType<typeof getPortfolioSections>>['all'][number]
