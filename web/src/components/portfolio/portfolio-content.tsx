'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { MermaidDiagram } from './mermaid-diagram'

interface PortfolioContentProps {
  markdown: string
  slug: string
  locale: string
  githubUrl?: string | null
  repoSlugs?: Record<string, string>
}

/**
 * README 속 링크를 우리 사이트에서 눌러도 맞는 곳으로 가게 고친다.
 * GitHub 에서는 상대 링크가 저장소 기준으로 풀리지만, 여기서는 페이지 주소 기준으로 풀려 404 가 난다.
 * (예: summa2-tauri 의 '../summa-electron/' → /ko/summa-electron 404)
 *  - '../<저장소>/' : 우리 포트폴리오에 있는 저장소면 그 프로젝트 페이지, 없으면 GitHub 의 그 저장소
 *  - 그 밖의 상대 경로 : 이 저장소의 GitHub 파일
 *  - 절대 주소·'#앵커'·mailto 등은 그대로
 * 돌려줄 주소가 없으면(githubUrl 없음) null — 링크 없이 글자만 남긴다.
 */
export function resolveReadmeHref(
  href: string,
  opts: { locale: string; githubUrl?: string | null; repoSlugs?: Record<string, string> }
): { href: string; internal: boolean } | null {
  if (!href) return null
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#') || href.startsWith('//')) {
    return { href, internal: false }
  }
  const repo = opts.githubUrl?.match(/^(https?:\/\/github\.com\/[^/]+)\/([^/#?]+)/i)
  const owner = repo?.[1]
  const repoUrl = repo ? `${repo[1]}/${repo[2].replace(/\.git$/, '')}` : null

  const hashAt = href.indexOf('#')
  const hash = hashAt >= 0 ? href.slice(hashAt) : ''
  let path = hashAt >= 0 ? href.slice(0, hashAt) : href

  // GitHub 에서 '/x' 는 github.com/x 로 풀린다
  if (path.startsWith('/')) return { href: `https://github.com${path}${hash}`, internal: false }

  path = path.replace(/^(\.\/)+/, '')
  if (path.startsWith('../')) {
    const [name, ...rest] = path.replace(/^(\.\.\/)+/, '').split('/')
    const restPath = rest.filter(Boolean).join('/')
    const target = name ? opts.repoSlugs?.[name.toLowerCase()] : undefined
    if (target && (!restPath || /^readme(\.[a-z]+)?\.md$/i.test(restPath))) {
      return { href: `/${opts.locale}/portfolio/${target}${hash}`, internal: true }
    }
    if (!owner || !name) return null
    return { href: `${owner}/${name}${restPath ? `/blob/HEAD/${restPath}` : ''}${hash}`, internal: false }
  }
  if (!repoUrl) return null
  return { href: `${repoUrl}/blob/HEAD/${path}${hash}`, internal: false }
}

function resolveImageSrc(src: string, slug: string, width?: number): string | null {
  if (!src) return null
  // 이미 절대 URL
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  // 로컬 static asset (/images/portfolio/...)
  if (src.startsWith('/')) return src
  // 상대 경로 → 로컬 프록시 URL (리사이즈 포함)
  const clean = src.replace(/^\.\//, '')
  const w = width ? `&w=${width}` : ''
  return `/api/v1/portfolio/image?slug=${encodeURIComponent(slug)}&path=${encodeURIComponent(clean)}${w}`
}

const MERMAID_PLACEHOLDER = '%%%MERMAID_'

function extractMermaidBlocks(md: string): { cleaned: string; blocks: string[] } {
  const blocks: string[] = []
  const cleaned = md.replace(/```mermaid\n([\s\S]*?)```/g, (_, chart) => {
    const index = blocks.length
    blocks.push(chart.trim())
    return `\n${MERMAID_PLACEHOLDER}${index}%%%\n`
  })
  return { cleaned, blocks }
}

export function PortfolioContent({ markdown, slug, locale, githubUrl, repoSlugs }: PortfolioContentProps) {
  // README 전처리
  const preprocessed = markdown
    .replace(/^#\s+.+\n/m, '') // 첫 번째 H1 제거
    .replace(/🌐.*?\n/g, '') // 언어 토글 줄 제거
    .replace(/!\[.*?\]\(https:\/\/img\.shields\.io\/.*?\)/g, '') // shields.io 배지 제거
    .replace(/<!--[\s\S]*?-->/g, '') // HTML 주석 제거
    .replace(/\n{3,}/g, '\n\n') // 연속 빈 줄 정리
    .trim()

  // Mermaid 블록을 ReactMarkdown 전에 추출 — pre/code 파이프라인 우회
  const { cleaned, blocks: mermaidBlocks } = extractMermaidBlocks(preprocessed)

  return (
    <div className="prose-portfolio">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
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
          p: ({ children, node }) => {
            // Mermaid placeholder 감지
            const text = typeof children === 'string' ? children :
              Array.isArray(children) && children.length === 1 && typeof children[0] === 'string' ? children[0] : null
            if (text) {
              const match = text.match(/^%%%MERMAID_(\d+)%%%$/)
              if (match) {
                const idx = parseInt(match[1], 10)
                if (mermaidBlocks[idx]) {
                  return <MermaidDiagram chart={mermaidBlocks[idx]} />
                }
              }
            }
            // 이미지가 포함된 p 태그 — flexbox 갤러리 레이아웃
            const align = node?.properties?.align as string | undefined
            const hasImages = Array.isArray(children) && children.some(
              (c) => typeof c === 'object' && c !== null && 'type' in c && c.type === 'img'
            )
            if (hasImages || align === 'center') {
              return (
                <p className="flex flex-wrap justify-center items-end gap-3 my-6">
                  {children}
                </p>
              )
            }
            return (
              <p className="text-base text-[#586065] leading-relaxed mb-4">
                {children}
              </p>
            )
          },
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
          a: ({ href, children }) => {
            const link = resolveReadmeHref(typeof href === 'string' ? href : '', { locale, githubUrl, repoSlugs })
            if (!link) return <>{children}</>
            if (link.href.startsWith('#')) {
              return <a href={link.href} className="text-[#0053db] hover:underline">{children}</a>
            }
            return (
              <a
                href={link.href}
                {...(link.internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                className="text-[#0053db] hover:underline"
              >
                {children}
              </a>
            )
          },
          code: ({ children, className }) => {
            const text = String(children).replace(/\n$/, '')
            const isBlock = className?.includes('language-')
            // tree 구조 감지 (├, └, │, ─ 문자 포함)
            const isTree = /[├└│─]/.test(text)
            if (isBlock || isTree) {
              return (
                <code className={`block p-4 rounded-lg text-sm font-mono overflow-x-auto mb-6 ${
                  isTree
                    ? 'bg-[#f8f9fb] text-[#2b3438] border border-[#eaeef2] leading-6'
                    : 'bg-[#2b3438] text-[#e8ecef]'
                }`}>
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
          img: ({ src, alt, width, height, ...rest }) => {
            // HTML <img width="200"> 등의 속성 처리
            const rawWidth = width ?? rest?.node?.properties?.width
            const numWidth = rawWidth ? parseInt(String(rawWidth), 10) : undefined
            const resolved = resolveImageSrc(typeof src === 'string' ? src : '', slug, numWidth)
            if (!resolved) return null
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolved}
                alt={alt || ''}
                {...(numWidth ? { style: { width: numWidth, maxWidth: '100%' } } : {})}
                className="rounded-lg border border-[#abb3b9]/10 inline-block"
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
