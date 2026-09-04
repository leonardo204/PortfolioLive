import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { SITE_URL, resolvedMetaFor, alternatesFor, PERSON } from '@/lib/site'
import { getAppStoreCount } from '@/lib/queries/portfolio'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  // 소개 문구의 앱 개수는 등록된 앱을 세어 채운다.
  const appCount = await getAppStoreCount()
  const meta = resolvedMetaFor(locale, appCount)
  const languages = alternatesFor('/')

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: meta.title,
      template: meta.titleTemplate,
    },
    description: meta.description,
    applicationName: meta.siteName,
    authors: [{ name: PERSON.nameKo, url: SITE_URL }],
    creator: PERSON.nameKo,
    publisher: PERSON.nameKo,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages,
    },
    openGraph: {
      type: 'profile',
      url: `${SITE_URL}/${locale}`,
      siteName: meta.siteName,
      title: meta.title,
      description: meta.description,
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
      alternateLocale: locale === 'en' ? 'ko_KR' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'ko' | 'en')) {
    notFound()
  }

  return <>{children}</>
}
