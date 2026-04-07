import { prisma } from '@/lib/prisma'

const HERO_KEYS = ['hero_title', 'hero_subtitle', 'hero_description'] as const

const HERO_DEFAULTS = {
  hero_title: 'AI Software\nEngineer',
  hero_subtitle: 'Agentic AI · Full-Stack · Embedded Systems',
  hero_description:
    '10년간 5,000만 대+ 디바이스에 탑재된 미들웨어를 개발하고, 현재는 Agentic AI 시스템과 음성 서비스를 설계합니다. App Store 출시 앱 5개.',
}

export async function HeroSection() {
  const rows = await prisma.adminSetting.findMany({
    where: { key: { in: [...HERO_KEYS] } },
  })

  const settings: Record<string, string> = { ...HERO_DEFAULTS }
  for (const row of rows) {
    settings[row.key] = row.value
  }

  const titleParts = settings.hero_title.split('\\n')

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
