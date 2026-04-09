/**
 * A2UI 마커 파서
 * <!--a2ui:type-->JSON<!--/a2ui--> 패턴을 파싱하여 텍스트/A2UI 세그먼트 배열로 반환
 */

export type Segment =
  | { type: 'text'; content: string }
  | { type: 'a2ui'; component: string; data: unknown }

const A2UI_PATTERN = /<!--a2ui:([a-z-]+)-->([\s\S]*?)<!--\/a2ui-->/g

/**
 * 콘텐츠 문자열을 텍스트와 A2UI 세그먼트 배열로 파싱
 * JSON 파싱 실패 시 해당 블록을 텍스트로 폴백
 */
export function parseA2UI(content: string): Segment[] {
  const segments: Segment[] = []
  let lastIndex = 0

  A2UI_PATTERN.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = A2UI_PATTERN.exec(content)) !== null) {
    const [fullMatch, component, jsonStr] = match
    const matchStart = match.index

    // 마커 앞 텍스트
    if (matchStart > lastIndex) {
      const textBefore = content.slice(lastIndex, matchStart)
      if (textBefore.trim()) {
        segments.push({ type: 'text', content: textBefore })
      }
    }

    // A2UI JSON 파싱 (실패 시 텍스트 폴백)
    try {
      // 1차: 그대로 파싱 시도
      const data = JSON.parse(jsonStr.trim())
      segments.push({ type: 'a2ui', component, data })
    } catch {
      try {
        // 2차: LLM이 멀티라인 JSON을 생성한 경우 — 문자열 값 내 리터럴 줄바꿈 이스케이프
        // JSON 문자열 리터럴("..." 내부)의 실제 줄바꿈/탭만 이스케이프
        const sanitized = jsonStr.trim().replace(/"(?:[^"\\]|\\.)*"/g, (str) =>
          str.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
        )
        const data = JSON.parse(sanitized)
        segments.push({ type: 'a2ui', component, data })
      } catch {
        // JSON 파싱 실패 → 원본 텍스트로 폴백
        segments.push({ type: 'text', content: fullMatch })
      }
    }

    lastIndex = matchStart + fullMatch.length
  }

  // 마지막 텍스트
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex)
    if (remaining.trim()) {
      segments.push({ type: 'text', content: remaining })
    }
  }

  // A2UI 마커가 없으면 전체를 텍스트로
  if (segments.length === 0) {
    segments.push({ type: 'text', content })
  }

  return segments
}
