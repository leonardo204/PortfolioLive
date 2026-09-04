/**
 * schema.org 구조화 데이터.
 *
 * 세 조각을 @id로 서로 이어 붙인다.
 *   WebSite(#website) → ProfilePage(#profile) → Person(#person)
 * 프로젝트 상세 페이지는 BreadcrumbList와 SoftwareSourceCode를 더하고,
 * isPartOf로 다시 WebSite에 연결한다.
 *
 * Person 하나만으로는 구글이 검색 결과를 따로 꾸며 주지 않는다.
 * 개인 소개 페이지에 맞는 타입은 ProfilePage다.
 */
import { SITE_URL, PERSON, metaFor, resolvedMetaFor } from './site'
import type { CareerWithProjects } from './queries/career'

const WEBSITE_ID = `${SITE_URL}/#website`
const PERSON_ID = `${SITE_URL}/#person`

function fmt(date: Date | null | undefined) {
  if (!date) return undefined
  return new Date(date).toISOString().slice(0, 7)
}

/**
 * 경력 한 건을 schema.org의 Role 표기로 옮긴다.
 * Role은 바깥 속성 이름을 안쪽에서 한 번 더 쓰는 규칙이 있어
 * alumniOf 안에 alumniOf를 다시 둔다.
 */
function toRole(career: CareerWithProjects, locale: string) {
  const isEn = locale === 'en'
  return {
    '@type': 'OrganizationRole',
    roleName: isEn ? career.positionEn || career.position : career.position,
    startDate: fmt(career.startedAt),
    endDate: fmt(career.endedAt),
    alumniOf: {
      '@type': 'Organization',
      name: isEn ? career.companyEn || career.company : career.company,
      department: {
        '@type': 'Organization',
        name: isEn ? career.departmentEn || career.department : career.department,
      },
    },
  }
}

export function personSchema(
  careers: CareerWithProjects[],
  locale: string,
  appCount?: number,
) {
  const isEn = locale === 'en'
  const meta = resolvedMetaFor(locale, appCount)
  const current = careers.find((c) => c.isCurrent) ?? careers[0]

  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: isEn ? PERSON.nameEn : PERSON.nameKo,
    alternateName: [isEn ? PERSON.nameKo : PERSON.nameEn, PERSON.alternateName],
    url: `${SITE_URL}/${locale}`,
    jobTitle: isEn ? PERSON.jobTitleEn : PERSON.jobTitleKo,
    description: meta.description,
    email: `mailto:${PERSON.email}`,
    knowsLanguage: ['ko', 'en'],
    address: {
      '@type': 'PostalAddress',
      addressLocality: isEn ? PERSON.locationEn : PERSON.locationKo,
      addressCountry: 'KR',
    },
    worksFor: current
      ? {
          '@type': 'Organization',
          name: isEn
            ? current.companyEn || current.company
            : current.company,
          department: {
            '@type': 'Organization',
            name: isEn
              ? current.departmentEn || current.department
              : current.department,
          },
        }
      : undefined,
    hasOccupation: {
      '@type': 'Occupation',
      name: isEn ? PERSON.jobTitleEn : PERSON.jobTitleKo,
      occupationLocation: {
        '@type': 'City',
        name: isEn ? PERSON.locationEn : PERSON.locationKo,
      },
    },
    knowsAbout: [
      'Agentic AI',
      'LangGraph',
      'Retrieval-Augmented Generation',
      'Set-Top Box Middleware',
      'Embedded Systems',
      'Next.js',
      'FastAPI',
      'Swift',
      'C++',
    ],
    alumniOf: careers.map((c) => toRole(c, locale)),
    sameAs: [PERSON.github],
  }
}

/** 홈 화면에 넣는 그래프 — 사이트, 프로필, 사람을 한 덩어리로 묶는다. */
export function homeGraph(
  careers: CareerWithProjects[],
  locale: string,
  appCount?: number,
) {
  const meta = resolvedMetaFor(locale, appCount)
  const person = personSchema(careers, locale, appCount)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE_URL,
        name: meta.siteName,
        description: meta.description,
        inLanguage: locale === 'en' ? 'en' : 'ko',
        publisher: { '@id': PERSON_ID },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${SITE_URL}/${locale}#profile`,
        url: `${SITE_URL}/${locale}`,
        name: meta.title,
        inLanguage: locale === 'en' ? 'en' : 'ko',
        isPartOf: { '@id': WEBSITE_ID },
        mainEntity: { '@id': PERSON_ID },
        about: { '@id': PERSON_ID },
      },
      person,
    ],
  }
}

interface ProjectForSchema {
  slug: string
  title: string
  description: string | null
  technologies: string[]
  githubUrl: string | null
  liveUrl: string | null
  appStoreUrl?: string | null
  year: string | null
  updatedAt: Date
}

/** 프로젝트 상세 화면 — 길찾기 표시와 프로젝트 정보를 넣는다. */
export function projectGraph(project: ProjectForSchema, locale: string) {
  const meta = metaFor(locale)
  const pageUrl = `${SITE_URL}/${locale}/portfolio/${project.slug}`
  const isEn = locale === 'en'

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: meta.siteName,
            item: `${SITE_URL}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isEn ? 'Portfolio' : '포트폴리오',
            item: `${SITE_URL}/${locale}#portfolio`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: project.title,
            item: pageUrl,
          },
        ],
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${pageUrl}#project`,
        name: project.title,
        description: project.description || undefined,
        url: pageUrl,
        codeRepository: project.githubUrl || undefined,
        programmingLanguage: project.technologies,
        // 내려받아 쓸 수 있는 곳이 있으면 함께 알린다.
        downloadUrl: project.appStoreUrl || undefined,
        dateModified: new Date(project.updatedAt).toISOString(),
        author: { '@id': PERSON_ID },
        isPartOf: { '@id': WEBSITE_ID },
      },
      {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: isEn ? PERSON.nameEn : PERSON.nameKo,
        url: `${SITE_URL}/${locale}`,
        jobTitle: isEn ? PERSON.jobTitleEn : PERSON.jobTitleKo,
        sameAs: [PERSON.github],
      },
    ],
  }
}
