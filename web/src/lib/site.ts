/**
 * 사이트 공통 정보 — 메타데이터·사이트맵·구조화 데이터가 같은 값을 쓴다.
 * 한 곳만 고치면 전부 따라 바뀐다.
 */

export const SITE_URL = 'https://me.zerolive.co.kr'

export const LOCALES = ['ko', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const PERSON = {
  nameKo: '이용섭',
  nameEn: 'Yongsub Lee',
  alternateName: 'Leonardo204',
  jobTitleKo: 'AI 소프트웨어 엔지니어',
  jobTitleEn: 'AI Software Engineer',
  companyKo: '케이티알티미디어',
  companyEn: 'KT Altimedia',
  departmentKo: '사업혁신팀',
  departmentEn: 'Business Innovation Team',
  positionKo: '선임연구원',
  positionEn: 'Senior Researcher',
  locationKo: '서울',
  locationEn: 'Seoul',
  github: 'https://github.com/leonardo204',
  email: 'zerolive7@gmail.com',
} as const

/** 검색 결과와 링크 미리보기에 그대로 나가는 문구 */
export const SITE_META = {
  ko: {
    title: `${PERSON.nameKo} | ${PERSON.jobTitleKo}`,
    titleTemplate: `%s | ${PERSON.nameKo}`,
    siteName: `${PERSON.nameKo} 포트폴리오`,
    description:
      '5,000만 대 이상의 디바이스에 미들웨어를 공급한 14년 차 소프트웨어 엔지니어입니다. 현재 케이티알티미디어 사업혁신팀에서 Agentic AI 제품을 만들고 있으며, App Store에 개인 앱 {appCount}개를 출시했습니다.',
    ogAlt: '이용섭 — AI 소프트웨어 엔지니어 포트폴리오',
  },
  en: {
    title: `${PERSON.nameEn} | ${PERSON.jobTitleEn}`,
    titleTemplate: `%s | ${PERSON.nameEn}`,
    siteName: `${PERSON.nameEn} Portfolio`,
    description:
      'Software engineer with 14 years of experience, shipping middleware to more than 50 million devices. Now building Agentic AI products at KT Altimedia, with {appCount} personal apps on the App Store.',
    ogAlt: 'Yongsub Lee — AI Software Engineer portfolio',
  },
} as const

export function metaFor(locale: string) {
  return locale === 'en' ? SITE_META.en : SITE_META.ko
}

/**
 * 문구 속 {appCount} 자리에 실제 개수를 넣는다.
 * 앱을 새로 등록하면 소개 문구가 저절로 따라 바뀌므로 숫자를 손으로 고칠 일이 없다.
 * 값을 못 구한 경우에는 자리표시자만 지워 문장이 깨지지 않게 한다.
 */
export function fillCounts(text: string, counts: { appCount?: number }): string {
  if (!text.includes('{appCount}')) return text

  const n = counts.appCount
  if (typeof n !== 'number' || n <= 0) {
    // 개수를 못 구한 경우(예: 데이터베이스 연결 실패)에도 문장이 읽히게 둔다.
    return text.replace(/\{appCount\}개/g, '여러 개').replaceAll('{appCount}', 'several')
  }

  return text.replaceAll('{appCount}', String(n))
}

/** 검색 결과에 나갈 문구를 실제 개수까지 채워 돌려준다. */
export function resolvedMetaFor(locale: string, appCount?: number) {
  const meta = metaFor(locale)
  return { ...meta, description: fillCounts(meta.description, { appCount }) }
}

/** 언어별 정식 주소 + hreflang 대응표 */
export function alternatesFor(path: string) {
  const clean = path === '/' ? '' : path
  return {
    ko: `${SITE_URL}/ko${clean}`,
    en: `${SITE_URL}/en${clean}`,
    'x-default': `${SITE_URL}/ko${clean}`,
  }
}
