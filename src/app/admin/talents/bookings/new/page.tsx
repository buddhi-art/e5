import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookingForm } from './booking-form'

export default async function NewBookingPage({ searchParams }: { searchParams: Promise<{ talent_id?: string }> }) {
    const { talent_id } = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/employee/dashboard')

    const { data: talents } = await supabase
        .from('talents')
        .select('id, full_name, talent_type')
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('full_name')

    const { data: projects } = await supabase
        .from('projects')
        .select('id, title')
        .is('deleted_at', null)
        .order('title')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">New Booking</h1>
                <p className="text-sm text-zinc-500">Book a talent for a project.</p>
            </div>
            <BookingForm
                talents={talents || []}
                projects={projects || []}
                preselectedTalentId={talent_id}
            />
        </div>
    )
}
