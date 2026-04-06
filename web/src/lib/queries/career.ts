import { prisma } from '@/lib/prisma'

export async function getCareers() {
  try {
    return await prisma.career.findMany({
      include: { workProjects: true },
      orderBy: { sortOrder: 'asc' }
    })
  } catch {
    // DB 연결 실패 시 빈 배열 반환 (빌드/개발 환경 대응)
    return []
  }
}

export type CareerWithProjects = Awaited<ReturnType<typeof getCareers>>[number]
