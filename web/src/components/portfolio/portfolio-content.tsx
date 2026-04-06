'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MermaidDiagram } from './mermaid-diagram'

interface PortfolioContentProps {
  markdown: string
}

/**
 * GitHub README 마크다운을 사이트 테마에 맞게 렌더링합니다.
 * 불필요한 섹션(언어 선택, 배지 이미지)을 정리하고,
 * 사이트 look & feel에 맞는 타이포그래피를 적용합니다.
 */
export function PortfolioContent({ markdown }: PortfolioContentProps) {
  // README 전처리
  const cleaned = markdown
    .replace(/^#\s+.+\n/m, '') // 첫 번째 H1 제거
    .replace(/🌐.*?\n/g, '') // 언어 토글 줄 제거
    .replace(/!\[.*?\]\(https:\/\/img\.shields\.io\/.*?\)/g, '') // shields.io 배지 제거
    .replace(/\n{3,}/g, '\n\n') // 연속 빈 줄 정리
    .trim()

  // 이미지의 상대 경로를 GitHub raw URL로 변환하지 않음 — 깨진 이미지는 숨김 처리

  return (
    <div className="prose-portfolio">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-[#2b3438] mt-12 mb-4 pb-3 border-b border-[#abb3b9]/15">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-bold text-[#2b3438] mt-8 mb-3">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-[#2b3438] mt-6 mb-2">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-base text-[#586065] leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6 text-[#586065]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 space-y-2 mb-6 text-[#586065]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-base leading-relaxed">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[#2b3438]">{children}</strong>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0053db] hover:underline"
            >
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const text = String(children).replace(/\n$/, '')
            const isMermaid = className?.includes('language-mermaid')
            if (isMermaid) {
              return <MermaidDiagram chart={text} />
            }
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <code className="block bg-[#2b3438] text-[#e8ecef] p-4 rounded-lg text-sm font-mono overflow-x-auto mb-6">
                  {text}
                </code>
              )
            }
            return (
              <code className="bg-[#eaeef2] text-[#2b3438] px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="mb-6 overflow-x-auto">{children}</pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#f1f4f7] text-[#2b3438] font-bold text-left">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 border-b border-[#abb3b9]/20">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 border-b border-[#abb3b9]/10 text-[#586065]">
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#dbe1ff] pl-4 py-1 my-4 text-[#586065] italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-[#abb3b9]/15" />,
          img: ({ src, alt }) => {
            const srcStr = typeof src === 'string' ? src : ''
            // 상대 경로 이미지는 표시하지 않음 (GitHub에서 직접 로드 불가)
            if (!srcStr || (!srcStr.startsWith('http://') && !srcStr.startsWith('https://'))) {
              return null
            }
            // eslint-disable-next-line @next/next/no-img-element
            return (
              <img
                src={srcStr}
                alt={alt || ''}
                className="rounded-lg max-w-full my-6 border border-[#abb3b9]/10"
              />
            )
          },
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  )
}
