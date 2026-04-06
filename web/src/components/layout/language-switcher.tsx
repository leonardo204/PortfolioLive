'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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
        <div className="absolute right-0 mt-1 w-48 bg-white border border-[#eaeef2] rounded-xl shadow-lg py-1 z-50">
          {/* 활성 언어 */}
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#2b3438] hover:bg-[#f1f4f7] transition-colors"
            onClick={() => setOpen(false)}
          >
            <span className="text-xs text-[#0053db] font-bold">●</span>
            한국어
          </button>

          {/* 비활성 언어 */}
          <button
            disabled
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#abb3b9] cursor-not-allowed"
          >
            <span className="text-xs text-transparent font-bold">●</span>
            English
            <span className="ml-auto text-xs text-[#abb3b9] font-normal">Coming soon</span>
          </button>
        </div>
      )}
    </div>
  )
}
