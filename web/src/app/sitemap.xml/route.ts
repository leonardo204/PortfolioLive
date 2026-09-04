/**
 * 사이트맵 — 표준 순서를 지키기 위해 직접 만든다.
 *
 * 사이트맵 규격은 <url> 안의 순서를 loc → lastmod → changefreq → priority →
 * 그 외 네임스페이스 요소(xhtml:link)로 정해 두었다. Next.js가 제공하는
 * sitemap.ts는 xhtml:link를 loc 바로 뒤에 넣어 이 순서를 어긴다.
 * 그대로 두면 공식 스키마 검증을 통과하지 못하므로 여기서 직접 만든다.
 */

import { prisma } from '@/lib/prisma'
import { SITE_URL, LOCALES, alternatesFor } from '@/lib/site'

// 도커 빌드 시점에는 데이터베이스가 없어 프로젝트 목록을 읽을 수 없다.
// 요청이 올 때 만들고, 조회 결과만 한 시간 동안 다시 쓴다.
export const dynamic = 'force-dynamic'

type ProjectRow = { slug: string; updatedAt: Date }

async function loadProjects(): Promise<ProjectRow[]> {
  try {
    return await prisma.portfolioProject.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
    })
  } catch {
    // 데이터베이스에 닿지 못하면 홈 주소만이라도 내보낸다.
    return []
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

interface Entry {
  loc: string
  lastmod: Date
  changefreq: 'weekly' | 'monthly'
  priority: string
  alternates: Record<string, string>
}

function renderEntry(entry: Entry): string {
  const lines = [
    '  <url>',
    `    <loc>${escapeXml(entry.loc)}</loc>`,
    `    <lastmod>${entry.lastmod.toISOString()}</lastmod>`,
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
  ]
  // 다른 네임스페이스 요소는 규격상 맨 뒤에 온다.
  for (const [hreflang, href] of Object.entries(entry.alternates)) {
    lines.push(
      `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(href)}" />`
    )
  }
  lines.push('  </url>')
  return lines.join('\n')
}

export async function GET() {
  const projects = await loadProjects()

  // 홈의 갱신 시각은 가장 최근에 바뀐 프로젝트를 따른다.
  // 요청할 때마다 현재 시각을 넣으면 검색엔진이 갱신 시각을 신뢰하지 못한다.
  const latest = projects.reduce<Date | null>(
    (acc, p) => (acc === null || p.updatedAt > acc ? p.updatedAt : acc),
    null
  )
  const homeLastmod = latest ?? new Date(0)

  const entries: Entry[] = []

  for (const locale of LOCALES) {
    entries.push({
      loc: `${SITE_URL}/${locale}`,
      lastmod: homeLastmod,
      changefreq: 'weekly',
      priority: '1.0',
      alternates: alternatesFor('/'),
    })
  }

  for (const project of projects) {
    const path = `/portfolio/${project.slug}`
    for (const locale of LOCALES) {
      entries.push({
        loc: `${SITE_URL}/${locale}${path}`,
        lastmod: project.updatedAt,
        changefreq: 'monthly',
        priority: '0.8',
        alternates: alternatesFor(path),
      })
    }
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
    ' xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries.map(renderEntry).join('\n') +
    '\n</urlset>\n'

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
