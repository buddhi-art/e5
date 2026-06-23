import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock } from 'lucide-react'
import { AdminTimesheetActions } from './timesheet-actions'

function formatWeek(dateStr: string) {
  const d = new Date(dateStr)
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  return `${d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Approved</Badge>
    case 'submitted': return <Badge className="bg-sky-500 hover:bg-sky-600">Submitted</Badge>
    case 'rejected': return <Badge variant="destructive">Rejected</Badge>
    case 'draft': return <Badge variant="outline">Draft</Badge>
    default: return <Badge variant="secondary">{status}</Badge>
  }
}

export default async function AdminTimesheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolvedParams = await params

  const { data: ts } = await supabase
    .from('timesheets')
    .select(`
      *,
      profiles!timesheets_user_id_fkey(full_name, email),
      timesheet_entries (
        *,
        projects(title),
        tasks(title)
      )
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (!ts) redirect('/admin/timesheets')

  // Group entries by date
  const entriesByDate: Record<string, any[]> = {}
  ts.timesheet_entries?.forEach((entry: any) => {
    if (!entriesByDate[entry.date]) {
      entriesByDate[entry.date] = []
    }
    entriesByDate[entry.date].push(entry)
  })

  // Sort dates
  const sortedDates = Object.keys(entriesByDate).sort()

  // Calculate totals
  const totalBillable = ts.timesheet_entries?.reduce((sum: number, e: any) => sum + (e.billable === 'billable' ? Number(e.hours) : 0), 0) || 0
  const totalNonBillable = ts.timesheet_entries?.reduce((sum: number, e: any) => sum + (e.billable === 'non_billable' ? Number(e.hours) : 0), 0) || 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" render={<Link href="/admin/timesheets" />} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center justify-between flex-1">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{ts.profiles?.full_name}</h1>
            <p className="text-zinc-500">{formatWeek(ts.week_starting)}</p>
          </div>
          <div>
            {getStatusBadge(ts.status)}
          </div>
        </div>
      </div>

      {ts.status === 'rejected' && ts.notes && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800">
          <p className="font-semibold mb-1">Rejection Reason</p>
          <p className="text-sm">{ts.notes}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Total Hours</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{ts.total_hours}h</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Clock className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Billable Hours</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalBillable}h</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Non-Billable Hours</p>
            <p className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">{totalNonBillable}h</p>
          </div>
        </div>
      </div>

      {/* Day by day breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Time Entries</h2>
        
        {sortedDates.map((date) => {
          const entries = entriesByDate[date]
          const dayTotal = entries.reduce((sum, e) => sum + Number(e.hours), 0)
          const d = new Date(date)

          return (
            <div key={date} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {d.toLocaleDateString(undefined, { weekday: 'long' })}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {dayTotal}h
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Billable</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium text-zinc-900 dark:text-white">{entry.projects?.title || '-'}</TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-400">{entry.tasks?.title || '-'}</TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-400">{entry.description || '-'}</TableCell>
                      <TableCell className="text-center">
                        {entry.billable === 'billable' ? (
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-zinc-500">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">{entry.hours}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        })}
      </div>

      {/* Review Actions */}
      {ts.status === 'submitted' && (
        <div className="flex justify-end pt-4">
          <AdminTimesheetActions timesheetId={ts.id} />
        </div>
      )}
    </div>
  )
}
