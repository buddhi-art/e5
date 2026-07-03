import { createClient } from '@/lib/supabase/server'
import { LeaveCalendar } from './leave-calendar'
import { format, startOfMonth } from 'date-fns'

export default async function AdminLeaveCalendarPage() {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEndStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const monthStartStr = format(monthStart, 'yyyy-MM-dd')

  // Fetch holidays
  const { data: holidays } = await supabase
    .from('holidays')
    .select('*')
    .order('date', { ascending: true })

  // Fetch approved leave requests for the current month
  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select(`
      id,
      start_date,
      end_date,
      total_days,
      status,
      leave_types(name),
      profiles!leave_requests_user_id_fkey(full_name)
    `)
    .eq('status', 'approved')
    .gte('start_date', monthStartStr)
    .lte('start_date', monthEndStr)
    .is('deleted_at', null)
    .order('start_date')

  // Build leave days map from the approved requests
  const leaveDaysMap = new Map<string, { id: string; name: string; leaveType: string; status: string }[]>()
  if (leaveRequests) {
    for (const req of leaveRequests) {
      const start = new Date(req.start_date)
      const end = new Date(req.end_date)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd')
        const existing = leaveDaysMap.get(dateStr) || []
        existing.push({
          id: req.id,
          name: (req.profiles as any)?.full_name || 'Unknown',
          leaveType: (req.leave_types as any)?.name || 'Leave',
          status: req.status,
        })
        leaveDaysMap.set(dateStr, existing)
      }
    }
  }

  const leaveDays = Array.from(leaveDaysMap.entries()).map(([date, employees]) => ({ date, employees }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Leave Calendar</h1>
        <p className="text-on-surface-variant">Monthly view of employee leave and holidays.</p>
      </div>

      <LeaveCalendar
        initialLeaveDays={leaveDays}
        initialHolidays={holidays || []}
        month={now}
      />
    </div>
  )
}
