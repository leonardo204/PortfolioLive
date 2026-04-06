import { MobileNav } from './mobile-nav'

const navItems = [
  { label: '경력', href: '#career' },
  { label: '포트폴리오', href: '#portfolio' },
  { label: '연락처', href: '#contact' },
]

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#abb3b9]/15">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          className="text-lg font-semibold tracking-tight text-[#2b3438] hover:text-[#0053db] transition-colors"
        >
          이용섭
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
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

        {/* Mobile Nav */}
        <MobileNav />
      </div>
    </header>
  )
}
