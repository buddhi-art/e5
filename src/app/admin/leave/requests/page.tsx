import { createClient } from '@/lib/supabase/server'
import { LeaveRequestsTable } from './leave-requests-table'

export default async function AdminLeaveRequestsPage() {
  const supabase = await createClient()

  const [requestsResult, leaveTypesResult] = await Promise.all([
    supabase
      .from('leave_requests')
      .select(`
        *,
        leave_types(name),
        profiles!leave_requests_user_id_fkey(full_name, email)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('leave_types')
      .select('id, name')
      .order('name'),
  ])

  const { data: requests } = requestsResult
  const { data: leaveTypes } = leaveTypesResult

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Leave Requests</h1>
        <p className="text-on-surface-variant">Review and manage employee leave applications.</p>
      </div>

      <LeaveRequestsTable requests={requests || []} leaveTypes={leaveTypes || []} />
    </div>
  )
}
