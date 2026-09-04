import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { PageTracker } from '@/components/layout/page-tracker'
import { SITE_URL, SITE_META } from '@/lib/site'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_META.ko.title,
  description: SITE_META.ko.description,
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
