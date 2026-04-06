'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, ChevronDown, ChevronRight, User, Bot } from 'lucide-react'

interface ChatMessage {
  id: number
  role: string
  content: string
  modelUsed: string | null
  latencyMs: number | null
  createdAt: string
}

interface ChatSession {
  id: number
  visitorId: string
  ipAddress: string | null
  startedAt: string
  messageCount: number
  messages: ChatMessage[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SessionRow({ session }: { session: ChatSession }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      {/* 세션 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-900 hover:bg-gray-850 transition-colors text-left"
      >
        <div className="text-gray-500">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-400 truncate">
              {session.visitorId.slice(0, 12)}...
            </span>
            <span className="text-xs text-gray-600">|</span>
            <span className="text-xs text-gray-400">{formatDate(session.startedAt)}</span>
            {session.ipAddress && (
              <>
                <span className="text-xs text-gray-600">|</span>
                <span className="text-xs text-gray-500">{session.ipAddress}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
            {session.messageCount}개 메시지
          </span>
        </div>
      </button>

      {/* 메시지 목록 */}
      {expanded && (
        <div className="divide-y divide-gray-800/50 bg-gray-950">
          {session.messages.length === 0 ? (
            <p className="px-6 py-4 text-xs text-gray-600">메시지 없음</p>
          ) : (
            session.messages.map((msg) => (
              <div key={msg.id} className="px-6 py-3 flex gap-3">
                <div className="shrink-0 mt-0.5">
                  {msg.role === 'user' ? (
                    <User size={14} className="text-blue-400" />
                  ) : (
                    <Bot size={14} className="text-green-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-medium uppercase tracking-wide ${
                      msg.role === 'user' ? 'text-blue-400' : 'text-green-400'
                    }`}>
                      {msg.role === 'user' ? '사용자' : '에이전트'}
                    </span>
                    <span className="text-[10px] text-gray-600">{formatDate(msg.createdAt)}</span>
                    {msg.modelUsed && (
                      <span className="text-[10px] text-gray-700 bg-gray-800 px-1.5 py-0.5 rounded">
                        {msg.modelUsed}
                      </span>
                    )}
                    {msg.latencyMs && (
                      <span className="text-[10px] text-gray-700">{msg.latencyMs}ms</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function ChatLogsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/admin/chat-logs')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => setSessions(data.sessions ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">채팅 로그</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '불러오는 중...' : `총 ${sessions.length}개 세션`}
          </p>
        </div>
        <MessageSquare size={20} className="text-gray-600" />
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300 mb-6">
          데이터를 불러오지 못했습니다: {error}
        </div>
      )}

      {!loading && sessions.length === 0 && !error && (
        <div className="text-center text-gray-600 mt-16">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">아직 채팅 세션이 없습니다.</p>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>
    </div>
  )
}
