import Link from 'next/link'
import { initialsOf, appPlatformsOf } from '@/lib/project-visual'
import type { PortfolioListItem } from '@/lib/queries/portfolio'

interface Props {
  projects: PortfolioListItem[]
  locale: string
}

/**
 * App Store에 올린 앱만 모아 보여준다.
 * 직접 내려받아 써 볼 수 있다는 점이 다른 프로젝트와 다르므로 따로 묶었다.
 * 목록에 들어가는 기준은 app_store_url 값이 있는지 하나뿐이라,
 * 새 앱을 등록하면 여기에 저절로 나타난다.
 */
export function AppShowcase({ projects, locale }: Props) {
  if (projects.length === 0) return null

  const en = locale === 'en'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const platforms = appPlatformsOf(project.appPlatforms, project.tags)
        return (
          <div
            key={project.id}
            className="group relative flex flex-col p-5 rounded-xl bg-white hover:shadow-[0px_8px_24px_rgba(43,52,56,0.05)] transition-all duration-300"
          >
            <div className="flex items-center gap-3.5 mb-3">
              <span
                aria-hidden="true"
                className="shrink-0 grid place-items-center w-11 h-11 rounded-[10px] bg-[#f1f4f7] text-[#586065] font-mono font-bold text-sm group-hover:bg-[#dbe1ff] group-hover:text-[#0048bf] transition-colors"
              >
                {initialsOf(project.title)}
              </span>
              <div className="min-w-0">
                {/* 카드 전체를 눌러도 상세로 가도록 넓게 잡는다. */}
                <Link
                  href={`/${locale}/portfolio/${project.slug}`}
                  className="before:absolute before:inset-0 text-base font-bold text-[#2b3438] group-hover:text-[#0053db] transition-colors leading-tight block truncate"
                >
                  {project.title}
                </Link>
                {platforms.length > 0 && (
                  <p className="text-[10px] font-mono text-[#abb3b9] uppercase tracking-widest mt-1 truncate">
                    {platforms.join(' · ')}
                  </p>
                )}
              </div>
            </div>

            {project.description && (
              <p className="text-xs text-[#586065] leading-relaxed line-clamp-2 mb-4">
                {project.description}
              </p>
            )}

            {/* 스토어와 소개 페이지로 바로 가는 길. 카드 링크 위에 얹어 따로 눌리게 한다. */}
            <div className="relative z-10 mt-auto flex flex-wrap items-center gap-1.5">
              <a
                href={project.appStoreUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1.5 rounded bg-[#dbe1ff] text-[#0048bf] hover:bg-[#c7d3ff] transition-colors"
              >
                {en ? 'View on App Store' : 'App Store에서 보기'}
                <span aria-hidden="true">↗</span>
              </a>
              {/*
                소개 페이지는 같은 도메인 식구다(*.zerolive.co.kr). 서로 걸어 두지 않으면
                검색 엔진에게는 각자 외딴 섬이라, robots.txt 만 확인하고 돌아간다.
                같은 창에서 연다 — 우리 집 안에서 옮겨 다니는 것이고, 그래야
                어디서 왔는지(Referer)가 남아 트래픽 화면에서 유입 경로를 셀 수 있다.
              */}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  className="inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1.5 rounded border border-[#dbe1ff] text-[#586065] hover:text-[#0048bf] hover:border-[#c7d3ff] transition-colors"
                >
                  {en ? 'Website' : '소개 페이지'}
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
