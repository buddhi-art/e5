import { createClient } from '@/lib/supabase/server'
import { getAssignedDeliverablesForEmployee } from '@/app/admin/packages/actions'
import { DeliverableWorkspace } from '@/components/employee/deliverable-workspace'

export default async function EmployeePackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const deliverables = await getAssignedDeliverablesForEmployee()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Package Deliverables</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          View your assigned video editing deliverables, paste Google Drive links, and handle Founder revisions.
        </p>
      </div>

      <DeliverableWorkspace deliverables={deliverables} />
    </div>
  )
}
