import { notFound } from 'next/navigation'
import { TalentForm } from '../../talent-form'
import { requireAdminOrFounder } from '@/lib/auth/page-guard'

export default async function EditTalentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { supabase } = await requireAdminOrFounder()

    const { data: talent, error } = await supabase
        .from('talents')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !talent) notFound()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-on-surface">Edit Talent</h1>
                <p className="text-sm text-outline">Update information for {talent.full_name}.</p>
            </div>
            <TalentForm initialData={talent} />
        </div>
    )
}
