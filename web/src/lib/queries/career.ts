import { prisma } from '@/lib/prisma'

export async function getCareers(locale: string = 'ko') {
  try {
    const careers = await prisma.career.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { workProjects: true },
    })

    if (locale === 'en') {
      return careers.map((c) => ({
        ...c,
        company: c.companyEn || c.company,
        department: c.departmentEn || c.department,
        position: c.positionEn || c.position,
        location: c.locationEn || c.location,
        techTransition: c.techTransitionEn || c.techTransition,
        summary: c.summaryEn || c.summary,
      }))
    }

    return careers
  } catch {
    // DB 연결 실패 시 빈 배열 반환 (빌드/개발 환경 대응)
    return []
  }
}

export type CareerWithProjects = Awaited<ReturnType<typeof getCareers>>[number]
