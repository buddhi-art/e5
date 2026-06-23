import { EmployeeSidebar } from '@/components/employee-sidebar'
import { TopNav } from '@/components/top-nav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white selection:bg-zinc-100 dark:bg-zinc-800">
      <EmployeeSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav userEmail={user?.email || 'Unknown User'} title="Employee Portal" />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-zinc-50 dark:bg-zinc-950">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
