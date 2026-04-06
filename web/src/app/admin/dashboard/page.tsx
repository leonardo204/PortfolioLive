import { prisma } from '@/lib/prisma'
import { Users, MessageSquare, MessageCircle, Mail, MailOpen } from 'lucide-react'

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
          ? 'bg-blue-950 border-blue-800'
          : 'bg-gray-900 border-gray-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400 font-medium tracking-tight">{title}</p>
        <div className={`p-2 rounded-lg ${highlight ? 'bg-blue-900 text-blue-300' : 'bg-gray-800 text-gray-400'}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white tabular-nums">
          {value.toLocaleString()}
        </p>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="flex-1 p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">포트폴리오 사이트 현황 요약</p>
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

      {/* 빈 상태 안내 */}
      {stats.totalVisitors === 0 && (
        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">아직 방문자 데이터가 없습니다.</p>
          <p className="text-xs mt-1">페이지 추적기가 활성화되면 데이터가 표시됩니다.</p>
        </div>
      )}
    </div>
  )
}
