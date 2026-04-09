'use client'

import { useEffect, useRef, useState } from 'react'

interface MermaidDiagramProps {
  chart: string
}

/**
 * Mermaid 차트 전처리 — 라인 단위로 파싱하여 안전하게 치환:
 * 1. 예약어와 충돌하는 노드 ID (예: TD) → _TD
 * 2. 한국어 subgraph ID → ASCII alias (라벨은 보존)
 */
function sanitizeChart(raw: string): string {
  const lines = raw.split('\n')

  // Pass 1: subgraph ID 매핑 수집
  const sgMap = new Map<string, string>()
  let sgIdx = 0
  for (const line of lines) {
    const m = line.match(/^\s*subgraph\s+(\S+?)(\[".*?"\])?\s*$/)
    if (m && /[^\x00-\x7F]/.test(m[1])) {
      sgMap.set(m[1], `sg${sgIdx++}`)
    }
  }

  // Pass 2: 예약어 노드 ID 매핑 수집
  const DIRECTION_KEYWORDS = new Set(['TD', 'TB', 'BT', 'RL', 'LR'])
  const nodeMap = new Map<string, string>()
  for (const line of lines) {
    // graph/flowchart 선언 라인은 스킵
    if (/^\s*(graph|flowchart)\s/i.test(line)) continue
    // 노드 정의: ID[label] 패턴
    const nodeMatches = line.matchAll(/\b([A-Z]{2,})\s*[\[({]/g)
    for (const nm of nodeMatches) {
      const id = nm[1]
      if (DIRECTION_KEYWORDS.has(id) && !nodeMap.has(id)) {
        nodeMap.set(id, `n${id}`)
      }
    }
  }

  if (sgMap.size === 0 && nodeMap.size === 0) return raw

  // Pass 3: 라인별 치환
  return lines.map(line => {
    // subgraph 선언 라인: ID만 치환, 라벨은 그대로
    const sgMatch = line.match(/^(\s*subgraph\s+)(\S+?)((?:\[".*?"\])?)\s*$/)
    if (sgMatch) {
      const replacement = sgMap.get(sgMatch[2])
      if (replacement) {
        // 라벨이 없으면 원래 ID를 라벨로 추가
        const label = sgMatch[3] || `["${sgMatch[2]}"]`
        return `${sgMatch[1]}${replacement}${label}`
      }
    }

    // graph/flowchart 선언 라인은 건드리지 않음
    if (/^\s*(graph|flowchart)\s/i.test(line)) return line

    // edge 연결 라인 및 노드 정의 라인: 예약어 노드 ID 치환
    let result = line
    for (const [original, replacement] of nodeMap) {
      // 단어 경계에서만 치환 (라벨 내부 제외)
      result = result.replace(new RegExp(`\\b${original}\\b(?![^\\[]*\\])`, 'g'), replacement)
    }

    // edge 연결의 한국어 subgraph ID 치환 (라벨 밖에서만)
    for (const [original, replacement] of sgMap) {
      // 라벨("..." 또는 [...]) 밖에서만 치환
      result = result.replace(new RegExp(`(?<![\\["\\w])${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\]"\\w])`, 'g'), replacement)
    }

    return result
  }).join('\n')
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'neutral',
          themeVariables: {
            primaryColor: '#dbe1ff',
            primaryTextColor: '#2b3438',
            primaryBorderColor: '#0053db',
            lineColor: '#abb3b9',
            secondaryColor: '#f1f4f7',
            tertiaryColor: '#f8f9fb',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          },
        })

        const id = `mermaid-${Math.random().toString(36).slice(2)}`
        const { svg: rendered } = await mermaid.render(id, sanitizeChart(chart))
        if (!cancelled) setSvg(rendered)
      } catch {
        if (!cancelled) setError(true)
      }
    }

    render()
    return () => { cancelled = true }
  }, [chart])

  if (error) {
    return (
      <pre className="bg-[#2b3438] text-[#e8ecef] p-4 rounded-lg text-sm font-mono overflow-x-auto mb-6">
        <code>{chart}</code>
      </pre>
    )
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-[#abb3b9]">
        다이어그램 로딩 중...
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="my-6 overflow-x-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
