'use client'

import { useEffect } from 'react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl font-bold text-gray-200 mb-4">500</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            예기치 않은 오류가 발생했습니다
          </h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            일시적인 오류입니다. 페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              다시 시도
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              홈으로
            </a>
          </div>
          {error.digest && (
            <p className="text-xs text-gray-400 mt-6 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
