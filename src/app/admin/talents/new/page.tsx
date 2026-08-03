import { TalentForm } from '../talent-form'
import { requireAdminOrFounder } from '@/lib/auth/page-guard'

export default async function NewTalentPage() {
    await requireAdminOrFounder()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-on-surface">Add New Talent</h1>
                <p className="text-sm text-outline">Add a model, actor, freelancer, or crew member to the directory.</p>
            </div>
            <TalentForm />
        </div>
    )
}
