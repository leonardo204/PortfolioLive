'use client'

const THINKING_TEXTS = [
  '질문을 분석하고 있습니다...',
  '관련 프로젝트를 검색 중...',
  '답변을 생성하고 있습니다...',
]

interface ThinkingIndicatorProps {
  text?: string
}

export function ThinkingIndicator({ text }: ThinkingIndicatorProps) {
  const displayText = text || THINKING_TEXTS[0]

  return (
    <div className="flex flex-col items-start gap-2 max-w-[85%]">
      <div className="bg-[#f1f4f7] text-[#586065] p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed border border-[#eaeef2] flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 bg-[#0053db] rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-1.5 h-1.5 bg-[#0053db] rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-1.5 h-1.5 bg-[#0053db] rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
        <span className="text-xs text-[#737c81]">{displayText}</span>
      </div>
    </div>
  )
}
