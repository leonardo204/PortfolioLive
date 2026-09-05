'use client'

import { useState, useEffect, FormEvent } from 'react'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { Fingerprint } from 'lucide-react'

const NEXT_PAGE = '/admin/careers'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passkeyBusy, setPasskeyBusy] = useState(false)
  const [passkeyReady, setPasskeyReady] = useState(false)
  // 이 주소가 막히면 비밀번호 칸을 잠근다. 패스키로는 계속 들어올 수 있다.
  const [ipBlocked, setIpBlocked] = useState(false)

  // 패스키를 못 쓰는 브라우저에서는 단추 자체를 감춘다.
  useEffect(() => {
    setPasskeyReady(browserSupportsWebAuthn())
  }, [])

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
        if (data.blocked) setIpBlocked(true)
        setLoading(false)
        return
      }

      // 하드 네비게이션: Next.js App Router의 RSC 캐시와 새 httpOnly 쿠키의
      // 레이스를 피하기 위해 router.push 대신 window.location 사용
      window.location.href = NEXT_PAGE
    } catch {
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setLoading(false)
    }
  }

  async function handlePasskey() {
    setError('')
    setPasskeyBusy(true)

    try {
      // 1) 서버에서 이번 로그인용 도전값을 받는다.
      const optionsRes = await fetch('/api/v1/admin/auth/passkey/options', { method: 'POST' })
      const optionsJSON = await optionsRes.json()
      if (!optionsRes.ok) {
        setError(optionsJSON.error || '패스키 로그인을 시작하지 못했습니다.')
        setPasskeyBusy(false)
        return
      }

      // 2) 기기가 지문·얼굴·잠금 해제를 확인하고 서명한다.
      const credential = await startAuthentication({ optionsJSON })

      // 3) 서명을 서버가 확인하면 세션 쿠키가 내려온다.
      const verifyRes = await fetch('/api/v1/admin/auth/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      })
      const verifyJSON = await verifyRes.json()

      if (!verifyRes.ok) {
        setError(verifyJSON.error || '패스키 로그인에 실패했습니다.')
        setPasskeyBusy(false)
        return
      }

      window.location.href = NEXT_PAGE
    } catch (e) {
      // 사용자가 창을 닫거나 취소한 경우는 오류로 알리지 않는다.
      const name = e instanceof Error ? e.name : ''
      if (name === 'NotAllowedError' || name === 'AbortError') {
        setPasskeyBusy(false)
        return
      }
      setError('이 기기에서 패스키를 쓸 수 없습니다. 비밀번호로 로그인해 주세요.')
      setPasskeyBusy(false)
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

          {error && (
            <div className="mb-5 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {passkeyReady && (
            <>
              <button
                type="button"
                onClick={handlePasskey}
                disabled={passkeyBusy || loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#2b3438] hover:bg-[#1f272a] disabled:bg-[#eaeef2] disabled:text-[#abb3b9] text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#0053db] focus:ring-offset-2 focus:ring-offset-white"
              >
                <Fingerprint size={16} />
                {passkeyBusy ? '기기 확인 중...' : '패스키로 로그인'}
              </button>

              <div className="flex items-center gap-3 my-5">
                <span className="h-px flex-1 bg-[#eaeef2]" />
                <span className="text-[10px] uppercase tracking-widest text-[#abb3b9]">
                  또는
                </span>
                <span className="h-px flex-1 bg-[#eaeef2]" />
              </div>
            </>
          )}

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
                disabled={ipBlocked}
                autoComplete="current-password"
                className="w-full px-3 py-2.5 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-[#2b3438] text-sm placeholder-[#abb3b9] disabled:bg-[#eaeef2] disabled:text-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db] focus:border-[#0053db] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || passkeyBusy || ipBlocked || !password}
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
