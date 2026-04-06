export function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 text-left">
      <div className="max-w-3xl">
        {/* Main Title */}
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-[#2b3438] mb-8 leading-[1.05]">
          Software
          <br />
          Engineer
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl font-semibold text-[#0053db] mb-6 tracking-tight">
          Embedded · Cross-Platform · AI Services
        </p>

        {/* Description */}
        <p className="text-base md:text-lg text-[#586065] leading-relaxed font-normal max-w-2xl">
          16년 경력, 3개 회사를 거치며 셋톱박스 미들웨어부터 AI 멀티에이전트 시스템까지.
          정밀한 아키텍처, 탁월한 실행력.
        </p>
      </div>
    </section>
  )
}
