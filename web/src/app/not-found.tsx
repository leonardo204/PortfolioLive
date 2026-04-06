import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-gray-200 mb-4 select-none">404</div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
