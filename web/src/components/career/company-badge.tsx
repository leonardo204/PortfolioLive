import { cn } from '@/lib/utils'

interface CompanyBadgeProps {
  companyType: string
  className?: string
}

function getBadgeStyle(companyType: string) {
  const type = companyType.toLowerCase()
  if (type === '대기업') {
    return {
      bg: 'bg-[#dbe1ff]',
      text: 'text-[#0048bf]',
      label: '대기업',
    }
  }
  if (type === '중견기업') {
    return {
      bg: 'bg-[#eaeef2]',
      text: 'text-[#586065]',
      label: '중견기업',
    }
  }
  return {
    bg: 'bg-[#f1f4f7]',
    text: 'text-[#586065]',
    label: type || '기타',
  }
}

export function CompanyBadge({ companyType, className }: CompanyBadgeProps) {
  const style = getBadgeStyle(companyType)
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
        style.bg,
        style.text,
        className
      )}
    >
      {style.label}
    </span>
  )
}
