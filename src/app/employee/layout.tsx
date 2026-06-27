import { EmployeeSidebar } from '@/components/employee-sidebar'
import { EmployeeMobileSidebar } from '@/components/employee-mobile-sidebar'
import { TopNav } from '@/components/top-nav'
import { PageTransition } from '@/components/page-transition'
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
    <div className="flex h-dvh overflow-hidden bg-background text-foreground selection:bg-primary/20">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        <EmployeeSidebar />
      </div>

      {/* Mobile sidebar drawer */}
      <EmployeeMobileSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav userEmail={user?.email || 'Unknown User'} title="Employee Portal" />
        <main className="flex-1 overflow-y-auto bg-surface-container-lowest p-4 lg:p-8 scrollbar-premium">
          <div className="max-w-6xl mx-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}
