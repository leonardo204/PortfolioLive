import AdminSidebar from '@/components/admin/sidebar'

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
