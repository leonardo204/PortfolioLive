import { prisma } from '@/lib/prisma'
import { Users, MessageSquare, MessageCircle, Mail, MailOpen } from 'lucide-react'
import Link from 'next/link'

async function getDashboardStats() {
  const [
    totalVisitors,
    totalSessions,
    totalMessages,
    totalContacts,
    unreadContacts,
  ] = await Promise.all([
    prisma.pageView.count(),
    prisma.chatSession.count(),
    prisma.chatMessage.count(),
    prisma.contactRequest.count(),
    prisma.contactRequest.count({ where: { isRead: false } }),
  ])

  return { totalVisitors, totalSessions, totalMessages, totalContacts, unreadContacts }
}

async function getRecentUserMessages() {
  return prisma.chatMessage.findMany({
    where: { role: 'user' },
    select: { content: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
}

async function getRecentChatSessions() {
  return prisma.chatSession.findMany({
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: { id: true, visitorId: true, messageCount: true, startedAt: true },
  })
}

async function getRecentContacts() {
  return prisma.contactRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  description?: string
  highlight?: boolean
}

function StatCard({ title, value, icon, description, highlight }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-6 flex flex-col gap-4 ${
        highlight
          ? 'bg-[#dbe1ff]/30 border-[#0053db]/20'
          : 'bg-white border-[#eaeef2]'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#586065] font-medium tracking-tight">{title}</p>
        <div className={`p-2 rounded-lg ${highlight ? 'bg-[#dbe1ff]/50 text-[#0053db]' : 'bg-[#f1f4f7] text-[#586065]'}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-[#2b3438] tabular-nums">
          {value.toLocaleString()}
        </p>
        {description && (
          <p className="text-xs text-[#abb3b9] mt-1">{description}</p>
        )}
      </div>
    </div>
  )
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

export default async function DashboardPage() {
  const [stats, recentMessages, recentSessions, recentContacts] = await Promise.all([
    getDashboardStats(),
    getRecentUserMessages(),
    getRecentChatSessions(),
    getRecentContacts(),
  ])

  // 최대 content 길이 (바 차트 너비 계산용)
  const maxLength = recentMessages.length > 0
    ? Math.max(...recentMessages.map((m) => m.content.length))
    : 1

  return (
    <div className="flex-1 p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2b3438] tracking-tight">대시보드</h1>
        <p className="text-sm text-[#abb3b9] mt-1">포트폴리오 사이트 현황 요약</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="총 방문자"
          value={stats.totalVisitors}
          icon={<Users size={18} />}
          description="누적 페이지뷰"
        />
        <StatCard
          title="채팅 세션"
          value={stats.totalSessions}
          icon={<MessageSquare size={18} />}
          description="총 대화 세션 수"
        />
        <StatCard
          title="채팅 메시지"
          value={stats.totalMessages}
          icon={<MessageCircle size={18} />}
          description="총 메시지 수"
        />
        <StatCard
          title="연락 요청"
          value={stats.totalContacts}
          icon={stats.unreadContacts > 0 ? <MailOpen size={18} /> : <Mail size={18} />}
          description={
            stats.unreadContacts > 0
              ? `미읽음 ${stats.unreadContacts}건`
              : '모두 읽음'
          }
          highlight={stats.unreadContacts > 0}
        />
      </div>

      {/* 2컬럼 섹션 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">

        {/* Popular Questions (최근 질문 TOP 5) */}
        <div className="bg-white rounded-xl border border-[#eaeef2] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#2b3438] uppercase tracking-wider">
              최근 질문 TOP 5
            </h2>
            <Link
              href="/admin/chat-logs"
              className="text-xs text-[#0053db] hover:underline uppercase tracking-wider"
            >
              VIEW ALL
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <p className="text-[#abb3b9] text-sm text-center py-8">
              아직 질문 데이터가 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentMessages.map((msg, idx) => {
                const barWidth = Math.max(8, Math.round((msg.content.length / maxLength) * 100))
                const shortContent =
                  msg.content.length > 60
                    ? msg.content.slice(0, 60) + '...'
                    : msg.content
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <span className="text-xs text-[#586065] truncate">{shortContent}</span>
                    <div className="h-2 rounded-full bg-[#0053db]/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0053db]"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Chat Sessions */}
        <div className="bg-white rounded-xl border border-[#eaeef2] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#2b3438] uppercase tracking-wider">
              최근 채팅 세션
            </h2>
            <Link
              href="/admin/chat-logs"
              className="text-xs text-[#0053db] hover:underline uppercase tracking-wider"
            >
              VIEW ALL
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <p className="text-[#abb3b9] text-sm text-center py-8">
              아직 채팅 세션 데이터가 없습니다.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-[#eaeef2]">
              <div className="grid grid-cols-3 pb-2">
                <span className="text-xs text-[#abb3b9] uppercase tracking-wider">방문자 ID</span>
                <span className="text-xs text-[#abb3b9] uppercase tracking-wider text-center">메시지</span>
                <span className="text-xs text-[#abb3b9] uppercase tracking-wider text-right">시작 시간</span>
              </div>
              {recentSessions.map((session) => (
                <div key={session.id} className="grid grid-cols-3 py-2.5">
                  <span className="text-sm text-[#586065] font-mono">
                    {session.visitorId.slice(0, 8)}
                  </span>
                  <span className="text-sm text-[#586065] text-center">
                    {session.messageCount}
                  </span>
                  <span className="text-xs text-[#abb3b9] text-right">
                    {formatDate(session.startedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Contact Requests */}
      <div className="bg-white rounded-xl border border-[#eaeef2] p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#2b3438] uppercase tracking-wider">
            최근 연락 요청
          </h2>
          <Link
            href="/admin/contacts"
            className="text-xs text-[#0053db] hover:underline uppercase tracking-wider"
          >
            VIEW ALL
          </Link>
        </div>

        {recentContacts.length === 0 ? (
          <p className="text-[#abb3b9] text-sm text-center py-8">
            아직 연락 요청이 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#eaeef2]">
                  <th className="text-xs text-[#abb3b9] uppercase tracking-wider text-left pb-2 font-normal">이름</th>
                  <th className="text-xs text-[#abb3b9] uppercase tracking-wider text-left pb-2 font-normal">소속</th>
                  <th className="text-xs text-[#abb3b9] uppercase tracking-wider text-left pb-2 font-normal">이메일</th>
                  <th className="text-xs text-[#abb3b9] uppercase tracking-wider text-left pb-2 font-normal">메시지</th>
                  <th className="text-xs text-[#abb3b9] uppercase tracking-wider text-left pb-2 font-normal">날짜</th>
                  <th className="text-xs text-[#abb3b9] uppercase tracking-wider text-left pb-2 font-normal">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeef2]">
                {recentContacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="text-sm text-[#586065] py-3 pr-4 whitespace-nowrap">
                      {contact.name}
                    </td>
                    <td className="text-sm text-[#586065] py-3 pr-4 whitespace-nowrap">
                      {contact.organization ?? '-'}
                    </td>
                    <td className="text-sm text-[#586065] py-3 pr-4 whitespace-nowrap">
                      {contact.email}
                    </td>
                    <td className="text-sm text-[#586065] py-3 pr-4 max-w-[200px] truncate">
                      {contact.message.length > 50
                        ? contact.message.slice(0, 50) + '...'
                        : contact.message}
                    </td>
                    <td className="text-xs text-[#abb3b9] py-3 pr-4 whitespace-nowrap">
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="py-3">
                      {!contact.isRead && (
                        <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                          미읽음
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
