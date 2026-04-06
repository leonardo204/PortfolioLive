export function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 text-left">
      <div className="max-w-3xl">
        {/* Main Title */}
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-[#2b3438] mb-8 leading-[1.05]">
          AI Software
          <br />
          Engineer
        </h1>

        {/* Subtitle — AI 강조, 현재 우선 */}
        <p className="text-xl md:text-2xl font-semibold text-[#0053db] mb-6 tracking-tight">
          AI Multi-Agent · Cross-Platform · Embedded
        </p>

        {/* Description */}
        <p className="text-base md:text-lg text-[#586065] leading-relaxed font-normal max-w-2xl">
          현재 AI 멀티에이전트 시스템과 음성 서비스를 개발하고 있으며,
          10년 이상의 임베디드·미디어 플랫폼 경험을 기반으로
          복잡한 시스템을 설계하고 구현합니다.
        </p>
      </div>
    </section>
  )
}
