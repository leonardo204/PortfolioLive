'use client'

import { MobileNav } from './mobile-nav'
import { LanguageSwitcher } from './language-switcher'

const navItems = [
  { label: '경력', href: '#career' },
  { label: '포트폴리오', href: '#portfolio' },
]

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#abb3b9]/15">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-mono font-bold tracking-tight text-[#2b3438] hover:text-[#0053db] transition-colors text-lg"
        >
          Leonardo204.
        </a>

        {/* Desktop Nav + Language Switcher */}
        <div className="hidden md:flex items-center gap-1">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-[#586065] hover:text-[#0053db] hover:bg-[#f1f4f7] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ml-2">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile Nav */}
        <MobileNav />
      </div>
    </header>
  )
}
