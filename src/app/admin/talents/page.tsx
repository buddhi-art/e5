import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TalentsGrid } from './talents-grid'

export default async function TalentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/employee/dashboard')

    const { data: talents, error } = await supabase
        .from('talents')
        .select('*')
        .is('deleted_at', null)
        .order('full_name')

    if (error) console.error('Error fetching talents:', error)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 morph-fade-in">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-on-surface">Talent Directory</h1>
                    <p className="text-sm text-outline">Manage models, actors, freelancers, and crew.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button render={<Link href="/admin/talents/bookings" />} variant="outline">
                        View Bookings
                    </Button>
                    <Button render={<Link href="/admin/talents/new" />}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Talent
                    </Button>
                </div>
            </div>

            <TalentsGrid initialTalents={talents || []} />
        </div>
    )
}
