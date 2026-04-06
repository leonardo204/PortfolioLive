import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Building2, MapPin, ArrowRight } from 'lucide-react'

async function getCareers() {
  return prisma.career.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { workProjects: true },
      },
    },
  })
}

function formatDate(date: Date | null): string {
  if (!date) return '현재'
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

function calcDuration(startedAt: Date, endedAt: Date | null): string {
  const end = endedAt ? new Date(endedAt) : new Date()
  const start = new Date(startedAt)
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  const years = Math.floor(months / 12)
  const remainMonths = months % 12

  if (years === 0) return `${remainMonths}개월`
  if (remainMonths === 0) return `${years}년`
  return `${years}년 ${remainMonths}개월`
}

export default async function AdminCareersPage() {
  const careers = await getCareers()

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
          <span className="uppercase tracking-widest">Admin</span>
          <span className="text-gray-600">/</span>
          <span className="text-blue-600 uppercase tracking-widest">경력</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">경력 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              {careers.length}개 회사 · 각 회사의 프로젝트를 관리하세요
            </p>
          </div>
        </div>
      </div>

      {/* 회사 카드 목록 */}
      <div className="grid gap-4">
        {careers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Building2 className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-gray-500 text-sm">등록된 경력이 없습니다.</p>
            <p className="text-gray-400 text-xs mt-1">
              시드 데이터를 실행하면 경력이 표시됩니다.
            </p>
          </div>
        ) : (
          careers.map((career) => (
            <div
              key={career.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-semibold text-gray-900">
                      {career.company}
                    </h2>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                      {career.companyType}
                    </span>
                    {career.isCurrent && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                        재직중
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>{career.department} · {career.position}</span>
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      <span>{career.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>
                      {formatDate(career.startedAt)} ~ {formatDate(career.endedAt)}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>{calcDuration(career.startedAt, career.endedAt)}</span>
                    {career.techTransition && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-400 truncate max-w-xs">
                          {career.techTransition}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-6">
                  <div className="text-center">
                    <div className="text-2xl font-mono font-bold text-gray-900">
                      {career._count.workProjects}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-400">
                      프로젝트
                    </div>
                  </div>

                  <Link
                    href={`/admin/careers/${career.id}/projects`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    프로젝트 관리
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
