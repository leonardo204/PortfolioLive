import type { Metadata } from 'next'
import AdminSidebar from '@/components/admin/sidebar'

export const metadata: Metadata = {
  title: 'Admin - Leonardo204',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AdminSidebar />
      <main className="ml-[240px] min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  )
}
