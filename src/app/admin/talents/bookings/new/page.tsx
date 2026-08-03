import { BookingForm } from './booking-form'
import { requireAdminOrFounder } from '@/lib/auth/page-guard'

export default async function NewBookingPage({ searchParams }: { searchParams: Promise<{ talent_id?: string }> }) {
    const { talent_id } = await searchParams
    const { supabase } = await requireAdminOrFounder()

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
                <h1 className="text-2xl font-bold tracking-tight text-on-surface">New Booking</h1>
                <p className="text-sm text-outline">Book a talent for a project.</p>
            </div>
            <BookingForm
                talents={talents || []}
                projects={projects || []}
                preselectedTalentId={talent_id}
            />
        </div>
    )
}
