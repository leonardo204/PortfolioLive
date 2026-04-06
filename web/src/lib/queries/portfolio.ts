import { prisma } from '@/lib/prisma'

export async function getPortfolioProjects() {
  try {
    return await prisma.portfolioProject.findMany({
      orderBy: { updatedAt: 'desc' }
    })
  } catch {
    // DB 연결 실패 시 빈 배열 반환 (빌드/개발 환경 대응)
    return []
  }
}

export type PortfolioProjectItem = Awaited<ReturnType<typeof getPortfolioProjects>>[number]
