import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TalentForm } from '../talent-form'

export default async function NewTalentPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/employee/dashboard')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Add New Talent</h1>
                <p className="text-sm text-zinc-500">Add a model, actor, freelancer, or crew member to the directory.</p>
            </div>
            <TalentForm />
        </div>
    )
}
