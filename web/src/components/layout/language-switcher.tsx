'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const switchLocale = (newLocale: string) => {
    // pathname은 /ko/... 또는 /en/... 형태
    // 현재 locale prefix를 새 locale로 교체
    const segments = pathname.split('/')
    if (segments[1] === locale) {
      segments[1] = newLocale
    } else {
      segments.splice(1, 0, newLocale)
    }
    const newPath = segments.join('/') || '/'
    window.location.href = newPath
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="언어 선택"
        aria-expanded={open}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-[#586065] hover:text-[#2b3438] hover:bg-[#f1f4f7] transition-colors"
      >
        <Globe size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-[#eaeef2] rounded-xl shadow-lg py-1 z-50">
          {/* 한국어 */}
          <button
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
              locale === 'ko'
                ? 'font-semibold text-[#2b3438] hover:bg-[#f1f4f7]'
                : 'text-[#586065] hover:bg-[#f1f4f7]'
            }`}
            onClick={() => switchLocale('ko')}
          >
            <span className={`text-xs font-bold ${locale === 'ko' ? 'text-[#0053db]' : 'text-transparent'}`}>●</span>
            한국어
          </button>

          {/* English */}
          <button
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
              locale === 'en'
                ? 'font-semibold text-[#2b3438] hover:bg-[#f1f4f7]'
                : 'text-[#586065] hover:bg-[#f1f4f7]'
            }`}
            onClick={() => switchLocale('en')}
          >
            <span className={`text-xs font-bold ${locale === 'en' ? 'text-[#0053db]' : 'text-transparent'}`}>●</span>
            English
          </button>
        </div>
      )}
    </div>
  )
}
