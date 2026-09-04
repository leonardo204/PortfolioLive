import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { PageTracker } from '@/components/layout/page-tracker'
import { SITE_URL, SITE_META, fillCounts } from '@/lib/site'
import { getAppStoreCount } from '@/lib/queries/portfolio'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_META.ko.title,
  // 이 값은 언어별 화면이 곧바로 덮어쓴다. 여기서는 자리표시자만 정리해 둔다.
  description: fillCounts(SITE_META.ko.description, {}),
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let locale = 'ko'
  let messages = {}

  try {
    locale = await getLocale()
    messages = await getMessages()

    // 기본 소개 문구의 {appCount} 자리를 미리 채운다.
    // 이 묶음은 브라우저로 그대로 넘어가므로 여기서 채워야 자리표시자가 남지 않는다.
    const hero = (messages as Record<string, unknown>).hero
    if (hero && typeof hero === 'object') {
      const h = hero as Record<string, unknown>
      if (typeof h.defaultDescription === 'string') {
        const appCount = await getAppStoreCount()
        h.defaultDescription = fillCounts(h.defaultDescription, { appCount })
      }
    }
  } catch {
    // admin, api routes may not have locale context
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <PageTracker />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
