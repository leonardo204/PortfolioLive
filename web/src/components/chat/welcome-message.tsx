'use client'

export function WelcomeMessage() {
  return (
    <div className="flex flex-col items-start gap-2 max-w-[85%]">
      <div className="bg-[#f1f4f7] text-[#2b3438] p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed border border-[#eaeef2]">
        안녕하세요! 이용섭님의 포트폴리오 에이전트입니다.
        <br />
        경력, 기술, 프로젝트에 대해 자유롭게 질문해주세요.
      </div>
    </div>
  )
}
