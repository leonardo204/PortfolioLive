'use client'

import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="w-full py-10 bg-[#f1f4f7] mt-20">
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Copyright */}
        <span className="text-xs tracking-widest uppercase text-[#586065]/70 font-medium">
          {t('copyright')}
        </span>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/leonardo204"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-widest text-[#0053db] hover:text-[#0048c1] transition-colors"
          >
            GitHub
          </a>
          <a
            href="mailto:zerolive7@gmail.com"
            className="text-xs font-bold uppercase tracking-widest text-[#0053db] hover:text-[#0048c1] transition-colors"
          >
            Email
          </a>

          {/* Admin */}
          <a
            href="/admin"
            className="text-xs text-[#abb3b9] hover:text-[#586065] transition-colors"
          >
            admin
          </a>
        </div>
      </div>
    </footer>
  )
}
