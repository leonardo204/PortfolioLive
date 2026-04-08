import { cn } from '@/lib/utils'

interface CompanyBadgeProps {
  companyType: string
  locale?: string
  className?: string
}

function getBadgeStyle(companyType: string, locale: string) {
  const type = companyType.toLowerCase()
  if (type === '대기업') {
    return {
      bg: 'bg-[#dbe1ff]',
      text: 'text-[#0048bf]',
      label: locale === 'en' ? 'Enterprise' : '대기업',
    }
  }
  if (type === '중견기업') {
    return {
      bg: 'bg-[#eaeef2]',
      text: 'text-[#586065]',
      label: locale === 'en' ? 'Mid-size' : '중견기업',
    }
  }
  return {
    bg: 'bg-[#f1f4f7]',
    text: 'text-[#586065]',
    label: type || (locale === 'en' ? 'Other' : '기타'),
  }
}

export function CompanyBadge({ companyType, locale = 'ko', className }: CompanyBadgeProps) {
  const type = companyType.toLowerCase()
  if (type !== '대기업' && type !== '중견기업') return null

  const style = getBadgeStyle(companyType, locale)
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
