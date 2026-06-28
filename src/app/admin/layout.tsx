import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminMobileSidebar } from '@/components/admin-mobile-sidebar'
import { TopNav } from '@/components/top-nav'
import { PageTransition } from '@/components/page-transition'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Defense-in-depth: verify user is actually admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, designation')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Founder designation — founder portal
  if (profile.designation === 'Founder') {
    redirect('/founder')
  }

  // Employees must not access admin
  if (profile.role === 'employee') {
    redirect('/employee')
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground selection:bg-primary/20">
      {/* Desktop sidebar — M3 navigation drawer */}
      <div className="hidden lg:flex shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar drawer */}
      <AdminMobileSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav userEmail={user?.email || 'Unknown User'} title="Admin Portal" />
        <main className="flex-1 overflow-y-auto bg-surface-container-lowest p-4 lg:p-8 scrollbar-premium">
          <div className="max-w-7xl mx-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}
