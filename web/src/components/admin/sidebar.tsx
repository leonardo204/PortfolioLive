'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  User,
  MessageSquare,
  Mail,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react'

const menuItems = [
  {
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    label: '대시보드',
    active: true,
  },
  {
    href: '/admin/careers',
    icon: Briefcase,
    label: '경력',
    active: true,
  },
  {
    href: '/admin/projects',
    icon: FolderKanban,
    label: '프로젝트',
    active: true,
  },
  {
    href: '/admin/profile',
    icon: User,
    label: '프로필',
    active: true,
  },
  {
    href: '/admin/chat-logs',
    icon: MessageSquare,
    label: '채팅 로그',
    active: true,
  },
  {
    href: '/admin/contacts',
    icon: Mail,
    label: '연락요청',
    active: true,
  },
  {
    href: '/admin/settings',
    icon: Settings,
    label: '설정',
    active: true,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/v1/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="w-[240px] h-screen fixed left-0 top-0 bg-white border-r border-[#eaeef2] flex flex-col p-4 overflow-y-auto z-50">
      {/* 타이틀 */}
      <div className="mb-8 px-2">
        <h1 className="text-lg font-semibold tracking-tight text-[#2b3438]">
          Leonardo204 Admin
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#abb3b9] mt-1">
          Admin Console
        </p>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isCurrentPath =
            pathname === item.href || pathname.startsWith(item.href + '/')

          if (!item.active) {
            // 비활성 메뉴 (coming soon)
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2 text-[#abb3b9] rounded-md cursor-not-allowed"
                title="Coming soon"
              >
                <Icon size={18} />
                <span className="text-sm font-normal tracking-tight">
                  {item.label}
                </span>
                <span className="ml-auto text-[9px] uppercase tracking-widest text-[#abb3b9]">
                  soon
                </span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 ${
                isCurrentPath
                  ? 'text-[#0053db] font-medium bg-[#dbe1ff]/30'
                  : 'text-[#586065] hover:text-[#2b3438] hover:bg-[#f1f4f7]'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-normal tracking-tight">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* 서비스 페이지 이동 */}
      <div className="mt-auto px-2 mb-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 text-[#586065] hover:text-[#0053db] hover:bg-[#f1f4f7] rounded-md transition-colors duration-150"
        >
          <ExternalLink size={16} />
          <span className="text-sm font-normal tracking-tight">서비스 페이지</span>
        </Link>
      </div>

      {/* 하단 사용자 정보 + 로그아웃 */}
      <div className="pt-6 border-t border-[#eaeef2] px-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#dbe1ff]/50 flex items-center justify-center text-[#0053db] text-xs font-bold ring-2 ring-[#f8f9fb]">
            A
          </div>
          <div>
            <p className="text-xs font-medium text-[#2b3438]">Admin User</p>
            <p className="text-[10px] text-[#abb3b9]">System Root</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-[#586065] hover:text-[#2b3438] hover:bg-[#f1f4f7] rounded-md transition-colors duration-150"
        >
          <LogOut size={16} />
          <span className="text-sm font-normal tracking-tight">로그아웃</span>
        </button>
      </div>
    </aside>
  )
}
