'use client'

import { useState, useEffect, FormEvent } from 'react'
import { ShieldBan, RefreshCw, Trash2, Unlock, Lock, Plus } from 'lucide-react'

type Block = {
  ip: string
  failedCount: number
  blocked: boolean
  firstFailedAt: string
  lastFailedAt: string
  blockedAt: string | null
  lastUserAgent: string | null
  note: string | null
}

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function AdminSecurityPage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [currentIp, setCurrentIp] = useState('')
  const [maxFailures, setMaxFailures] = useState(3)
  const [loading, setLoading] = useState(true)
  const [busyIp, setBusyIp] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [newIp, setNewIp] = useState('')
  const [newNote, setNewNote] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    void fetchBlocks()
  }, [])

  async function fetchBlocks() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/ip-blocks')
      if (!res.ok) {
        setError('목록을 불러오지 못했습니다.')
        return
      }
      const data = await res.json()
      setBlocks(data.blocks ?? [])
      setCurrentIp(data.currentIp ?? '')
      setMaxFailures(data.maxFailures ?? 3)
      setError('')
    } catch {
      setError('목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function setBlocked(ip: string, blocked: boolean) {
    setBusyIp(ip)
    setError('')
    try {
      const res = await fetch('/api/v1/admin/ip-blocks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, blocked }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || '변경에 실패했습니다.')
        return
      }
      await fetchBlocks()
    } catch {
      setError('변경 중 오류가 발생했습니다.')
    } finally {
      setBusyIp(null)
    }
  }

  async function removeBlock(ip: string) {
    if (!confirm(`${ip} 기록을 지울까요?`)) return
    setBusyIp(ip)
    setError('')
    try {
      const res = await fetch(`/api/v1/admin/ip-blocks?ip=${encodeURIComponent(ip)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        setError('삭제에 실패했습니다.')
        return
      }
      setBlocks((prev) => prev.filter((b) => b.ip !== ip))
    } catch {
      setError('삭제 중 오류가 발생했습니다.')
    } finally {
      setBusyIp(null)
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const ip = newIp.trim()
    if (!ip) return
    if (ip === currentIp && !confirm('지금 접속한 주소입니다. 그래도 막을까요?')) return

    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/v1/admin/ip-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, note: newNote.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || '차단 추가에 실패했습니다.')
        return
      }
      setNewIp('')
      setNewNote('')
      await fetchBlocks()
    } catch {
      setError('차단 추가 중 오류가 발생했습니다.')
    } finally {
      setAdding(false)
    }
  }

  const blocked = blocks.filter((b) => b.blocked)
  const watching = blocks.filter((b) => !b.blocked)

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#abb3b9] text-sm">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-[#586065] mb-4">
          <span className="uppercase tracking-widest">Admin</span>
          <span className="text-[#abb3b9]">/</span>
          <span className="text-[#0053db] uppercase tracking-widest">보안</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#2b3438]">차단된 주소</h1>
            <p className="text-sm text-[#586065] mt-1">
              비밀번호를 {maxFailures}번 틀리면 그 주소에서의 로그인이 막힙니다. 패스키 로그인은 막히지 않습니다.
            </p>
          </div>
          <button
            onClick={fetchBlocks}
            className="flex items-center gap-2 px-3 py-2 bg-[#f1f4f7] hover:bg-[#eaeef2] text-[#586065] text-sm font-medium rounded-md transition-colors"
          >
            <RefreshCw size={14} />
            새로고침
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 지금 접속한 주소 */}
      {currentIp && (
        <p className="mb-6 text-xs text-[#abb3b9]">
          지금 접속한 주소: <span className="font-mono text-[#586065]">{currentIp}</span>
        </p>
      )}

      {/* 차단 목록 */}
      <div className="bg-white rounded-lg border border-[#eaeef2] mb-6">
        <div className="px-6 py-4 border-b border-[#eaeef2] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#2b3438]">차단 중</h2>
            <p className="text-xs text-[#abb3b9] mt-0.5">
              풀어주기 전까지 비밀번호로 들어올 수 없습니다.
            </p>
          </div>
          <span className="text-xs font-mono text-[#abb3b9]">{blocked.length}개</span>
        </div>

        {blocked.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <ShieldBan className="mx-auto mb-3 text-[#abb3b9]" size={32} />
            <p className="text-sm text-[#586065]">차단된 주소가 없습니다.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#eaeef2]">
            {blocked.map((b) => (
              <li key={b.ip} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-[#2b3438]">{b.ip}</span>
                    {b.ip === currentIp && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[#dbe1ff] text-[#0048bf] rounded">
                        지금 접속 중
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#586065] mt-1">
                    실패 {b.failedCount}회 · 차단 {formatDateTime(b.blockedAt)}
                    {b.note ? ` · ${b.note}` : ''}
                  </p>
                  {b.lastUserAgent && (
                    <p className="text-[11px] text-[#abb3b9] mt-1 truncate max-w-2xl">
                      {b.lastUserAgent}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setBlocked(b.ip, false)}
                    disabled={busyIp === b.ip}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0053db] hover:bg-[#0048bf] disabled:bg-[#eaeef2] text-white text-xs font-medium rounded-md transition-colors"
                  >
                    <Unlock size={12} />
                    풀기
                  </button>
                  <button
                    onClick={() => removeBlock(b.ip)}
                    disabled={busyIp === b.ip}
                    className="p-1.5 text-[#abb3b9] hover:text-red-500 transition-colors"
                    title="기록 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 실패만 쌓인 주소 */}
      {watching.length > 0 && (
        <div className="bg-white rounded-lg border border-[#eaeef2] mb-6">
          <div className="px-6 py-4 border-b border-[#eaeef2]">
            <h2 className="text-sm font-semibold text-[#2b3438]">지켜보는 중</h2>
            <p className="text-xs text-[#abb3b9] mt-0.5">
              아직 막히지 않았습니다. 30분 동안 더 틀리지 않으면 횟수가 사라집니다.
            </p>
          </div>
          <ul className="divide-y divide-[#eaeef2]">
            {watching.map((b) => (
              <li key={b.ip} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-mono text-sm text-[#2b3438]">{b.ip}</span>
                  <p className="text-xs text-[#586065] mt-0.5">
                    실패 {b.failedCount}/{maxFailures}회 · 마지막 {formatDateTime(b.lastFailedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setBlocked(b.ip, true)}
                    disabled={busyIp === b.ip}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f4f7] hover:bg-[#eaeef2] text-[#586065] text-xs font-medium rounded-md transition-colors"
                  >
                    <Lock size={12} />
                    바로 막기
                  </button>
                  <button
                    onClick={() => removeBlock(b.ip)}
                    disabled={busyIp === b.ip}
                    className="p-1.5 text-[#abb3b9] hover:text-red-500 transition-colors"
                    title="기록 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 직접 추가 */}
      <div className="bg-white rounded-lg border border-[#eaeef2]">
        <div className="px-6 py-4 border-b border-[#eaeef2]">
          <h2 className="text-sm font-semibold text-[#2b3438]">직접 막기</h2>
          <p className="text-xs text-[#abb3b9] mt-0.5">
            로그에서 수상한 주소를 발견했을 때 미리 막아 둡니다.
          </p>
        </div>
        <form onSubmit={handleAdd} className="px-6 py-5 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
              주소
            </label>
            <input
              type="text"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="203.0.113.10"
              className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] font-mono focus:outline-none focus:ring-1 focus:ring-[#0053db]"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
              메모
            </label>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="선택 사항"
              className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !newIp.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0053db] hover:bg-[#0048bf] disabled:bg-[#eaeef2] disabled:text-[#abb3b9] text-white text-sm font-medium rounded-md transition-colors"
          >
            <Plus size={14} />
            {adding ? '추가 중...' : '막기'}
          </button>
        </form>
      </div>
    </div>
  )
}
