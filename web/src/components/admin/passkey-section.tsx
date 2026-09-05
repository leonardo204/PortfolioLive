'use client'

import { useState, useEffect, useCallback } from 'react'
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { Fingerprint, Trash2, Plus, Check, X, Pencil } from 'lucide-react'

type Passkey = {
  id: string
  label: string
  deviceType: string
  backedUp: boolean
  transports: string[]
  createdAt: string
  lastUsedAt: string | null
}

function formatDate(value: string | null): string {
  if (!value) return '아직 쓴 적 없음'
  const d = new Date(value)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 기기가 알려준 값으로 어디에 저장된 패스키인지 한 줄로 설명한다. */
function describe(key: Passkey): string {
  if (key.backedUp) return '다른 기기와 동기화됨'
  if (key.transports.includes('internal')) return '이 기기에만 저장됨'
  if (key.transports.includes('usb') || key.transports.includes('nfc')) return '보안 키'
  return '단일 기기'
}

export default function PasskeySection() {
  const [keys, setKeys] = useState<Passkey[]>([])
  const [loading, setLoading] = useState(true)
  const [supported, setSupported] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/passkey')
      if (res.ok) setKeys(await res.json())
      else setError('패스키 목록을 불러오지 못했습니다.')
    } catch {
      setError('패스키 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setSupported(browserSupportsWebAuthn())
    load()
  }, [load])

  async function handleRegister() {
    setError('')
    setNotice('')
    setBusy(true)

    try {
      // 1) 서버에서 등록 요청서를 받는다.
      const optionsRes = await fetch('/api/v1/admin/passkey/register/options', {
        method: 'POST',
      })
      const optionsJSON = await optionsRes.json()
      if (!optionsRes.ok) {
        setError(optionsJSON.error || '패스키 등록을 시작하지 못했습니다.')
        setBusy(false)
        return
      }

      // 2) 기기가 새 열쇠를 만들고 지문·얼굴로 잠근다.
      const credential = await startRegistration({ optionsJSON })

      // 3) 서버가 확인하고 공개키를 저장한다.
      const verifyRes = await fetch('/api/v1/admin/passkey/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, label: newLabel }),
      })
      const verifyJSON = await verifyRes.json()

      if (!verifyRes.ok) {
        setError(verifyJSON.error || '패스키를 등록하지 못했습니다.')
        setBusy(false)
        return
      }

      setNewLabel('')
      setNotice('패스키를 등록했습니다. 다음 로그인부터 쓸 수 있습니다.')
      setTimeout(() => setNotice(''), 4000)
      await load()
    } catch (e) {
      const name = e instanceof Error ? e.name : ''
      if (name === 'NotAllowedError' || name === 'AbortError') {
        setBusy(false)
        return
      }
      if (name === 'InvalidStateError') {
        setError('이 기기는 이미 등록돼 있습니다.')
        setBusy(false)
        return
      }
      setError('이 기기에서는 패스키를 만들 수 없습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(key: Passkey) {
    if (!confirm(`'${key.label}' 패스키를 지울까요? 이 기기로는 더 이상 로그인할 수 없습니다.`)) {
      return
    }
    setError('')
    try {
      const res = await fetch(`/api/v1/admin/passkey?id=${encodeURIComponent(key.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || '패스키를 지우지 못했습니다.')
        return
      }
      await load()
    } catch {
      setError('패스키를 지우지 못했습니다.')
    }
  }

  async function handleRename(id: string) {
    setError('')
    try {
      const res = await fetch('/api/v1/admin/passkey', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, label: editLabel }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || '이름을 바꾸지 못했습니다.')
        return
      }
      setEditingId(null)
      await load()
    } catch {
      setError('이름을 바꾸지 못했습니다.')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-[#eaeef2] mt-6">
      <div className="px-6 py-4 border-b border-[#eaeef2]">
        <h2 className="text-sm font-semibold text-[#2b3438]">패스키</h2>
        <p className="text-xs text-[#abb3b9] mt-0.5">
          비밀번호 대신 지문·얼굴·기기 잠금으로 로그인합니다. 기기마다 하나씩 등록합니다.
        </p>
      </div>

      <div className="px-6 py-5">
        {error && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
        {notice && (
          <div className="mb-4 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-600">{notice}</p>
          </div>
        )}

        {!supported && (
          <p className="text-xs text-[#abb3b9] mb-4">
            지금 쓰는 브라우저는 패스키를 지원하지 않습니다. 다른 브라우저에서 등록해 주세요.
          </p>
        )}

        {/* 등록 */}
        <div className="flex items-center gap-2 mb-6">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="기기 이름 (예: 맥북 Touch ID)"
            maxLength={60}
            className="flex-1 px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
          />
          <button
            type="button"
            onClick={handleRegister}
            disabled={busy || !supported}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0053db] hover:bg-[#0048bf] disabled:bg-[#eaeef2] disabled:text-[#abb3b9] text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
          >
            <Plus size={13} />
            {busy ? '기기 확인 중...' : '이 기기 등록'}
          </button>
        </div>

        {/* 목록 */}
        {loading ? (
          <p className="text-xs text-[#abb3b9] py-4">불러오는 중...</p>
        ) : keys.length === 0 ? (
          <div className="py-8 text-center">
            <Fingerprint className="mx-auto mb-2 text-[#abb3b9]" size={28} />
            <p className="text-sm text-[#586065]">등록된 패스키가 없습니다.</p>
            <p className="text-xs text-[#abb3b9] mt-1">
              등록 전까지는 비밀번호로만 로그인합니다.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#eaeef2] border-t border-[#eaeef2]">
            {keys.map((key) => (
              <li key={key.id} className="py-3.5 flex items-center gap-3">
                <Fingerprint size={16} className="text-[#abb3b9] shrink-0" />

                <div className="min-w-0 flex-1">
                  {editingId === key.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        maxLength={60}
                        autoFocus
                        className="flex-1 px-2 py-1 bg-[#f8f9fb] border border-[#eaeef2] rounded text-sm text-[#2b3438] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRename(key.id)}
                        className="p-1.5 text-[#0053db] hover:bg-[#f1f4f7] rounded"
                        aria-label="이름 저장"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-[#586065] hover:bg-[#f1f4f7] rounded"
                        aria-label="이름 변경 취소"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[#2b3438] truncate">
                        {key.label}
                      </p>
                      <p className="text-[11px] text-[#abb3b9] mt-0.5">
                        {describe(key)} · 등록 {formatDate(key.createdAt)} · 최근 사용{' '}
                        {formatDate(key.lastUsedAt)}
                      </p>
                    </>
                  )}
                </div>

                {editingId !== key.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(key.id)
                        setEditLabel(key.label)
                      }}
                      className="p-1.5 text-[#abb3b9] hover:text-[#586065] hover:bg-[#f1f4f7] rounded transition-colors"
                      aria-label="이름 바꾸기"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(key)}
                      className="p-1.5 text-[#abb3b9] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      aria-label="패스키 지우기"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
