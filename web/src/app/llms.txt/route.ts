/**
 * llms.txt — AI 답변 엔진과 에이전트가 한 번에 읽는 사이트 요약.
 *
 * 왜 두는가. 사람이 보는 화면은 링크를 따라다녀야 전체가 잡히고, 본문도 자바스크립트로
 * 그려진다. AI 도우미가 "이용섭이 누구인가"를 물었을 때 그 과정을 다 거치지 않고도
 * 정확히 답하도록, 사실만 추린 평문을 한 장으로 둔다(llmstxt.org 관례).
 *
 * 다른 랜딩(lnhud · md-editor · golf · wander · hamzzi-diet)은 이미 같은 파일을 두고 있다.
 * 실제로 크롤러가 /llms.txt 를 요청했는데 이 사이트에만 없어서 404가 났다.
 *
 * 내용은 데이터베이스에서 만든다 — 프로젝트를 추가하면 이 파일도 따라 바뀐다.
 * 데이터베이스에 닿지 못하면 사람 정보와 주소만 내보낸다(빈 파일보다 낫다).
 */

import { prisma } from '@/lib/prisma'
import { PERSON, SITE_URL } from '@/lib/site'

// 도커 빌드 시점에는 데이터베이스가 없다. 요청이 올 때 만든다.
export const dynamic = 'force-dynamic'

type Row = {
  slug: string
  title: string
  titleEn: string | null
  description: string | null
  descriptionEn: string | null
  category: string | null
  year: string | null
  technologies: string[]
  githubUrl: string | null
  liveUrl: string | null
  appStoreUrl: string | null
  featured: boolean
}

type Career = {
  company: string
  companyEn: string | null
  department: string | null
  position: string | null
  startedAt: Date
  endedAt: Date | null
  isCurrent: boolean
  summary: string | null
}

async function load(): Promise<{ projects: Row[]; careers: Career[] }> {
  try {
    const [projects, careers] = await Promise.all([
      prisma.portfolioProject.findMany({
        select: {
          slug: true, title: true, titleEn: true, description: true, descriptionEn: true,
          category: true, year: true, technologies: true,
          githubUrl: true, liveUrl: true, appStoreUrl: true, featured: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
      }),
      prisma.career.findMany({
        select: {
          company: true, companyEn: true, department: true, position: true,
          startedAt: true, endedAt: true, isCurrent: true, summary: true,
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ])
    return { projects, careers }
  } catch {
    return { projects: [], careers: [] }
  }
}

const ym = (d: Date | null): string =>
  d ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}` : ''

/** 한 줄이 너무 길면 읽는 쪽이 잘라 버린다. 설명은 한 문장까지만 싣는다. */
function oneLine(v: string | null, max = 150): string {
  if (!v) return ''
  const s = v.replace(/\s+/g, ' ').trim()
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`
}

function build(projects: Row[], careers: Career[]): string {
  const L: string[] = []
  const apps = projects.filter((p) => p.appStoreUrl)
  const featured = projects.filter((p) => p.featured)

  L.push(`# ${PERSON.nameKo} (${PERSON.nameEn}) — ${PERSON.jobTitleKo}`)
  L.push('')
  L.push(
    '> 미들웨어를 5,000만 대 넘는 디바이스에 공급한 14년 차 소프트웨어 엔지니어의 포트폴리오.',
    `> 지금은 ${PERSON.companyKo} ${PERSON.departmentKo}에서 ${PERSON.positionKo}으로 Agentic AI 제품을 만든다.`,
    '> Portfolio of a software engineer with 14 years of experience, whose middleware ships on',
    `> more than 50 million devices. Now building Agentic AI products at ${PERSON.companyEn}.`,
  )
  L.push('')
  L.push(`- Home (Korean): ${SITE_URL}/ko`)
  L.push(`- Home (English): ${SITE_URL}/en`)
  L.push(`- GitHub: ${PERSON.github}`)
  L.push(`- Contact: ${PERSON.email}`)
  L.push(`- Location: ${PERSON.locationKo} (${PERSON.locationEn}), South Korea`)
  L.push(`- Also known as: ${PERSON.alternateName}`)
  if (projects.length) L.push(`- Projects listed here: ${projects.length}`)
  if (apps.length) L.push(`- Apps on the App Store: ${apps.length}`)
  L.push('')

  if (careers.length) {
    L.push('## 경력 (Career)')
    L.push('')
    for (const c of careers) {
      const span = `${ym(c.startedAt)} ~ ${c.isCurrent ? '현재 (present)' : ym(c.endedAt)}`
      const who = [c.company, c.companyEn && c.companyEn !== c.company ? `(${c.companyEn})` : '']
        .filter(Boolean)
        .join(' ')
      const role = [c.department, c.position].filter(Boolean).join(' · ')
      L.push(`- ${who} — ${role} · ${span}`)
      const s = oneLine(c.summary, 180)
      if (s) L.push(`  ${s}`)
    }
    L.push('')
  }

  if (apps.length) {
    L.push('## App Store 앱 (published apps)')
    L.push('')
    L.push('개인이 직접 만들어 App Store에 올린 것들이다. 각 앱에는 따로 소개 페이지가 있다.')
    L.push('')
    for (const p of apps) {
      const name = p.titleEn && p.titleEn !== p.title ? `${p.title} (${p.titleEn})` : p.title
      L.push(`### ${name}`)
      const d = oneLine(p.description ?? p.descriptionEn)
      if (d) L.push(d)
      L.push(`- App Store: ${p.appStoreUrl}`)
      if (p.liveUrl) L.push(`- Landing page: ${p.liveUrl}`)
      L.push(`- Detail: ${SITE_URL}/ko/portfolio/${p.slug}`)
      if (p.githubUrl) L.push(`- Source: ${p.githubUrl}`)
      L.push('')
    }
  }

  if (featured.length) {
    L.push('## 대표작 (selected work)')
    L.push('')
    for (const p of featured) {
      const d = oneLine(p.description ?? p.descriptionEn, 120)
      L.push(`- ${p.title}${p.year ? ` (${p.year})` : ''} — ${SITE_URL}/ko/portfolio/${p.slug}`)
      if (d) L.push(`  ${d}`)
    }
    L.push('')
  }

  if (projects.length) {
    L.push('## 전체 프로젝트 (all projects)')
    L.push('')
    L.push('분류별로 묶었다. 각 줄의 주소가 그 프로젝트의 상세 페이지다(영어는 /en/ 으로 바꾼다).')
    L.push('')
    const byCat = new Map<string, Row[]>()
    for (const p of projects) {
      const k = p.category || '기타'
      const arr = byCat.get(k)
      if (arr) arr.push(p)
      else byCat.set(k, [p])
    }
    for (const [cat, list] of byCat) {
      L.push(`### ${cat}`)
      for (const p of list) {
        const tech = p.technologies?.length ? ` [${p.technologies.slice(0, 5).join(', ')}]` : ''
        L.push(`- ${p.title} — ${SITE_URL}/ko/portfolio/${p.slug}${tech}`)
      }
      L.push('')
    }
  }

  L.push('## 같은 사람이 만든 다른 사이트 (related sites)')
  L.push('')
  L.push('- LnHud (macOS 입력기 표시): https://lnhud.zerolive.co.kr/')
  L.push('- MarkChartEditor (macOS 마크다운 편집기): https://md-editor.zerolive.co.kr/')
  L.push('- 라운드온 RoundOn (Apple Watch 골프 스코어): https://golf.zerolive.co.kr/')
  L.push('- Wandery (사진으로 만드는 여행 기록): https://wander.zerolive.co.kr/')
  L.push('- 햄찌 다이어트 (사진 한 장으로 식단 기록): https://hamzzi-diet.zerolive.co.kr/')
  L.push('')

  L.push('## 수집 규칙 (usage)')
  L.push('')
  L.push('검색 목록을 만들고 결과를 보여주는 것, 그리고 답변을 만들 때 참고하고 출처로 다는 것은')
  L.push('허용한다. 모델 학습을 위한 수집은 허용하지 않는다. 자세한 것은 robots.txt 에 적어 두었다.')
  L.push(`- ${SITE_URL}/robots.txt`)
  L.push(`- ${SITE_URL}/sitemap.xml`)
  L.push('')

  return L.join('\n')
}

export async function GET() {
  const { projects, careers } = await load()
  return new Response(build(projects, careers), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // robots.txt 와 같은 주기로 둔다. 프로젝트를 추가해도 하루 안에 따라 바뀐다.
      'Cache-Control': 'public, max-age=0, s-maxage=86400',
    },
  })
}
