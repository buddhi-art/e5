import { FounderSidebar } from '@/components/founder-sidebar'
import { FounderMobileSidebar } from '@/components/founder-mobile-sidebar'
import { TopNav } from '@/components/top-nav'
import { PageTransition } from '@/components/page-transition'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function FounderLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Defense-in-depth: verify user is actually a Founder
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, designation')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    // Not a Founder — redirect to correct portal
    if (profile.designation !== 'Founder') {
        if (profile.role === 'admin') {
            redirect('/admin')
        } else {
            redirect('/employee')
        }
    }

    return (
        <div className="flex h-dvh overflow-hidden bg-background text-foreground selection:bg-primary/20">
            {/* Desktop sidebar */}
            <div className="hidden lg:flex shrink-0">
                <FounderSidebar />
            </div>

            {/* Mobile sidebar drawer */}
            <FounderMobileSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <TopNav userEmail={user?.email || 'Unknown User'} title="Founder Portal" />
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
