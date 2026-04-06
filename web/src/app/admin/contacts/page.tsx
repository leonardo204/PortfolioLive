'use client'

import { useEffect, useState } from 'react'
import { Mail, MailOpen, Check } from 'lucide-react'

interface ContactRequest {
  id: number
  name: string
  organization: string | null
  email: string
  message: string
  ipAddress: string | null
  isRead: boolean
  createdAt: string
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

function ContactCard({
  contact,
  onMarkRead,
}: {
  contact: ContactRequest
  onMarkRead: (id: number) => void
}) {
  const [marking, setMarking] = useState(false)

  async function handleMarkRead() {
    if (contact.isRead || marking) return
    setMarking(true)
    try {
      const res = await fetch('/api/v1/admin/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contact.id, isRead: true }),
      })
      if (res.ok) {
        onMarkRead(contact.id)
      }
    } catch {
      // noop
    } finally {
      setMarking(false)
    }
  }

  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        contact.isRead
          ? 'bg-gray-900 border-gray-800'
          : 'bg-gray-900 border-blue-800/60'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-0.5 shrink-0 ${contact.isRead ? 'text-gray-600' : 'text-blue-400'}`}>
            {contact.isRead ? <MailOpen size={18} /> : <Mail size={18} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm">{contact.name}</span>
              {contact.organization && (
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                  {contact.organization}
                </span>
              )}
              {!contact.isRead && (
                <span className="text-[10px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded-full uppercase tracking-wide font-medium">
                  new
                </span>
              )}
            </div>
            <a
              href={`mailto:${contact.email}`}
              className="text-xs text-blue-400 hover:underline mt-0.5 block"
            >
              {contact.email}
            </a>
            <p className="text-sm text-gray-300 mt-2 leading-relaxed line-clamp-3">
              {contact.message}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-[11px] text-gray-600 whitespace-nowrap">
            {formatDate(contact.createdAt)}
          </span>
          {!contact.isRead && (
            <button
              onClick={handleMarkRead}
              disabled={marking}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
            >
              <Check size={12} />
              {marking ? '처리 중...' : '읽음'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/admin/contacts')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => setContacts(data.contacts ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleMarkRead(id: number) {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isRead: true } : c))
    )
  }

  const unreadCount = contacts.filter((c) => !c.isRead).length

  return (
    <div className="flex-1 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">연락 요청</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? '불러오는 중...'
              : `총 ${contacts.length}건${unreadCount > 0 ? ` · 미읽음 ${unreadCount}건` : ''}`}
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="text-xs bg-blue-900 text-blue-300 px-3 py-1.5 rounded-full font-medium">
            {unreadCount}건 미읽음
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300 mb-6">
          데이터를 불러오지 못했습니다: {error}
        </div>
      )}

      {!loading && contacts.length === 0 && !error && (
        <div className="text-center text-gray-600 mt-16">
          <Mail size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">아직 연락 요청이 없습니다.</p>
        </div>
      )}

      <div className="space-y-3">
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onMarkRead={handleMarkRead}
          />
        ))}
      </div>
    </div>
  )
}
