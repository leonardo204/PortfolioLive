'use client'

import { useEffect, useRef, useState } from 'react'

interface MermaidDiagramProps {
  chart: string
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
        const { svg: rendered } = await mermaid.render(id, chart)
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
