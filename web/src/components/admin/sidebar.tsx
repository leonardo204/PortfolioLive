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
    active: false,
  },
  {
    href: '/admin/profile',
    icon: User,
    label: '프로필',
    active: false,
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
    <aside className="w-[240px] h-screen fixed left-0 top-0 bg-gray-950 flex flex-col p-4 overflow-y-auto z-50">
      {/* 타이틀 */}
      <div className="mb-8 px-2">
        <h1 className="text-lg font-semibold tracking-tight text-white">
          PortfolioLive Admin
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">
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
                className="flex items-center gap-3 px-3 py-2 text-gray-600 rounded-md cursor-not-allowed"
                title="Coming soon"
              >
                <Icon size={18} />
                <span className="text-sm font-normal tracking-tight">
                  {item.label}
                </span>
                <span className="ml-auto text-[9px] uppercase tracking-widest text-gray-700">
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
                  ? 'text-white font-medium bg-gray-800'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
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

      {/* 하단 사용자 정보 + 로그아웃 */}
      <div className="mt-auto pt-6 border-t border-gray-800 px-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 text-xs font-bold">
            A
          </div>
          <div>
            <p className="text-xs font-medium text-white">Admin User</p>
            <p className="text-[10px] text-gray-500">System Root</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors duration-150"
        >
          <LogOut size={16} />
          <span className="text-sm font-normal tracking-tight">로그아웃</span>
        </button>
      </div>
    </aside>
  )
}
