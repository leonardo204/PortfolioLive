/**
 * 프로젝트 카드에 쓰는 표시용 값들.
 *
 * 스크린샷이 거의 없는 상태라 썸네일 대신 글자로 자리를 채운다.
 * 제목에서 짧은 약칭을 뽑아 고정폭 글꼴로 보여주면
 * 카드마다 크기가 같아 목록이 흐트러지지 않는다.
 */

/** 제목에서 2~3글자 약칭을 뽑는다. VTT Media… → VTT, MarkdownEditor → ME, naby → NA */
export function initialsOf(title: string): string {
  const clean = title.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim()
  if (!clean) return '··'

  const words = clean.split(/\s+/).filter(Boolean)
  const first = words[0] ?? ''

  // STB, VTT처럼 이미 약어인 경우 그대로 쓴다.
  if (/^[A-Z]{2,4}$/.test(first)) return first

  // MarkdownEditor처럼 단어를 붙여 쓴 경우 대문자만 모은다.
  const caps = first.match(/[A-Z]/g)
  if (caps && caps.length >= 2) return caps.slice(0, 3).join('')

  // 여러 낱말이면 낱말마다 첫 글자를 딴다.
  if (words.length >= 2) {
    return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
  }

  return first.slice(0, 2).toUpperCase()
}

/** 태그에서 어느 기기용인지 골라낸다. 배지에 그대로 쓴다. */
const PLATFORM_LABELS: Record<string, string> = {
  ios: 'iPhone',
  watch: 'Apple Watch',
  desktop: 'Mac',
  tv: 'TV',
  web: 'Web',
  android: 'Android',
  embedded: 'Embedded',
  cloud: 'Cloud',
}

export function platformsOf(tags: string[] | null | undefined): string[] {
  if (!tags?.length) return []
  const found = tags
    .map((t) => PLATFORM_LABELS[t])
    .filter((v): v is string => Boolean(v))
  return Array.from(new Set(found)).slice(0, 3)
}

/** 연도 문자열에서 정렬·표시에 쓸 마지막 연도를 뽑는다. "2023-2026" → 2026 */
export function latestYear(year: string | null | undefined): number {
  if (!year) return 0
  const nums = year.match(/\d{4}/g)
  if (!nums?.length) return 0
  return Math.max(...nums.map(Number))
}
