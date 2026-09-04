import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { reportStatus } from '@/lib/hit'

export default async function LocaleNotFound() {
  const t = await getTranslations('notFound')
  // 미들웨어는 통과 여부만 알아서 200으로 남긴다. 여기서 404로 고쳐 보낸다.
  await reportStatus(404)

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-gray-200 mb-4 select-none">404</div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          {t('title')}
        </h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          {t('description')}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          {t('home')}
        </Link>
      </div>
    </div>
  )
}
