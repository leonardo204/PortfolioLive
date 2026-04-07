'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/v1/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '로그인에 실패했습니다.')
        return
      }

      router.push('/admin/careers')
      router.refresh()
    } catch {
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-[#2b3438] tracking-tight">
            Leonardo204
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-[#abb3b9] mt-1">
            Admin Console
          </p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-lg p-8 border border-[#eaeef2] shadow-sm">
          <h2 className="text-sm font-medium text-[#2b3438] mb-6">
            관리자 로그인
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#586065] mb-1.5 uppercase tracking-wider"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                className="w-full px-3 py-2.5 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-[#2b3438] text-sm placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db] focus:border-[#0053db] transition-colors"
              />
            </div>

            {error && (
              <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 px-4 bg-[#0053db] hover:bg-[#0048bf] disabled:bg-[#eaeef2] disabled:text-[#abb3b9] text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#0053db] focus:ring-offset-2 focus:ring-offset-[#f8f9fb]"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
