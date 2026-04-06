'use client'

import { useState } from 'react'
import { CopilotKit } from '@copilotkit/react-core'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/sections/hero-section'
import { CareerSection } from '@/components/sections/career-section'
import { PortfolioSection } from '@/components/sections/portfolio-section'
import { ChatTrigger } from '@/components/chat/chat-trigger'
import { ChatPanel } from '@/components/chat/chat-panel'

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="echo_agent">
      <Header />
      <main
        className={`pt-16 pb-16 bg-[#f8f9fb] transition-[padding-right] duration-200 ${
          isChatOpen ? 'md:pr-[400px]' : ''
        }`}
      >
        <HeroSection />
        <CareerSection />
        <PortfolioSection />
      </main>
      <Footer />
      <ChatTrigger onClick={() => setIsChatOpen(true)} isOpen={isChatOpen} />
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </CopilotKit>
  )
}
