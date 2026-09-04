import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/sections/hero-section'
import { CareerSection } from '@/components/sections/career-section'
import { PortfolioSection } from '@/components/sections/portfolio-section'
import { ChatWrapper } from '@/components/chat/chat-wrapper'
import { JsonLd } from '@/components/seo/json-ld'
import { getCareers } from '@/lib/queries/career'
import { homeGraph } from '@/lib/structured-data'

// next-intl이 요청 정보를 읽어야 해서 화면을 미리 만들어 둘 수 없다.
// 대신 미들웨어가 응답에 캐시 헤더를 붙여, 콘텐츠 전송망이 한 시간 동안 보관한다.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function Home({ params }: Props) {
  const { locale } = await params
  const careers = await getCareers(locale)

  return (
    <>
      <JsonLd data={homeGraph(careers, locale)} />
      <Header />
      <main className="pt-16 pb-16 bg-[#f8f9fb]">
        <HeroSection locale={locale} />
        <CareerSection locale={locale} />
        <PortfolioSection locale={locale} />
      </main>
      <Footer />
      <ChatWrapper />
    </>
  )
}
