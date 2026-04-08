import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'

const HERO_KEYS = ['hero_title', 'hero_subtitle', 'hero_description'] as const

interface Props {
  locale: string
}

export async function HeroSection({ locale }: Props) {
  const t = await getTranslations('hero')

  const HERO_DEFAULTS = {
    hero_title: t('defaultTitle'),
    hero_subtitle: t('defaultSubtitle'),
    hero_description: t('defaultDescription'),
  }

  let settings: Record<string, string> = { ...HERO_DEFAULTS }

  try {
    const rows = await prisma.adminSetting.findMany({
      where: { key: { in: [...HERO_KEYS] } },
    })

    for (const row of rows) {
      // Only use DB values for ko locale; en uses message defaults
      if (locale === 'ko') {
        settings[row.key] = row.value
      }
    }
  } catch {
    // DB unavailable, use defaults
  }

  const titleParts = settings.hero_title.replace('\\n', '\n').split('\n')

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 text-left">
      <div className="max-w-3xl">
        {/* Main Title */}
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-[#2b3438] mb-8 leading-[1.05]">
          {titleParts.map((part, i) => (
            <span key={i}>
              {part}
              {i < titleParts.length - 1 && <br />}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl font-semibold text-[#0053db] mb-6 tracking-tight">
          {settings.hero_subtitle}
        </p>

        {/* Description */}
        <p className="text-base md:text-lg text-[#586065] leading-relaxed font-normal max-w-2xl">
          {settings.hero_description}
        </p>
      </div>
    </section>
  )
}
