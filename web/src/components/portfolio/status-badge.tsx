/**
 * 카드에 붙는 표시. 색은 두 가지만 쓴다.
 *  - 파랑: 지금 어떤 상태인지 (운영 중, App Store 출시)
 *  - 회색: 분류에 해당하는 것 (기술, 기기)
 * 색을 늘리면 무엇이 중요한지 알 수 없게 되므로 여기서 막는다.
 */

interface Props {
  children: React.ReactNode
  tone?: 'accent' | 'muted'
  dot?: boolean
}

export function StatusBadge({ children, tone = 'muted', dot = false }: Props) {
  const accent = tone === 'accent'
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded ${
        accent ? 'bg-[#dbe1ff] text-[#0048bf]' : 'bg-[#eaeef2] text-[#586065]'
      }`}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#0053db]" aria-hidden="true" />
      )}
      {children}
    </span>
  )
}
