'use client'

const SUGGESTIONS = [
  '어떤 기술을 주로 사용하나요?',
  'AI 프로젝트 경험을 알려주세요',
  '최근 프로젝트는 무엇인가요?',
]

interface PreSuggestionProps {
  onSelect: (text: string) => void
  disabled?: boolean
}

export function PreSuggestion({ onSelect, disabled }: PreSuggestionProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {SUGGESTIONS.map((text) => (
        <button
          key={text}
          onClick={() => !disabled && onSelect(text)}
          disabled={disabled}
          className="px-4 py-2 text-xs font-medium rounded-full border border-[#dbe1ff] bg-[#dbe1ff]/30 text-[#0048bf] hover:bg-[#dbe1ff] hover:border-[#0053db] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
        >
          {text}
        </button>
      ))}
    </div>
  )
}
