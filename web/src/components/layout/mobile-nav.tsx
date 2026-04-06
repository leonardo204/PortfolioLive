'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const navItems = [
  { label: '경력', href: '#career' },
  { label: '포트폴리오', href: '#portfolio' },
  { label: '연락처', href: '#contact' },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-[#586065] hover:text-[#2b3438] hover:bg-[#f1f4f7] transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#abb3b9]/20">
          <span className="font-semibold text-[#2b3438]">이용섭</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="메뉴 닫기"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[#586065] hover:text-[#2b3438] hover:bg-[#f1f4f7] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col px-6 py-8 gap-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl text-[#2b3438] font-semibold hover:bg-[#f1f4f7] hover:text-[#0053db] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </>
  )
}
