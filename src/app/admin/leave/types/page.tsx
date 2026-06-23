import { createClient } from '@/lib/supabase/server'
import { LeaveTypesManager } from './leave-types-manager'

export default async function AdminLeaveTypesPage() {
  const supabase = await createClient()

  const { data: types } = await supabase
    .from('leave_types')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Leave Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Configure the different types of leave available to employees.</p>
      </div>

      <LeaveTypesManager initialTypes={types || []} />
    </div>
  )
}
