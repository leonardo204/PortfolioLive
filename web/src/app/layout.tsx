import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { PageTracker } from '@/components/layout/page-tracker'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Leonardo204',
  description: '이용섭 포트폴리오',
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
