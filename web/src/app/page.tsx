import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/sections/hero-section'
import { CareerSection } from '@/components/sections/career-section'
import { PortfolioSection } from '@/components/sections/portfolio-section'
import { ChatTrigger } from '@/components/chat/chat-trigger'

export const revalidate = 3600

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-16 pb-16 bg-[#f8f9fb]">
        <HeroSection />
        <CareerSection />
        <PortfolioSection />
      </main>
      <Footer />
      <ChatTrigger />
    </>
  )
}
