import { prisma } from '@/lib/prisma'

export async function getPortfolioProjects(locale: string = 'ko') {
  try {
    const projects = await prisma.portfolioProject.findMany({
      orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }, { updatedAt: 'desc' }]
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

export type PortfolioProjectItem = Awaited<ReturnType<typeof getPortfolioProjects>>[number]
