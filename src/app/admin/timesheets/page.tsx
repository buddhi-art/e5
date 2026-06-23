import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText, Clock } from 'lucide-react'

function formatWeek(dateStr: string) {
  const d = new Date(dateStr)
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
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

export default async function AdminTimesheetsPage() {
  const supabase = await createClient()

  // Fetch all timesheets with user profiles
  const { data: timesheets } = await supabase
    .from('timesheets')
    .select(`
      *,
      profiles!timesheets_user_id_fkey(full_name, email)
    `)
    .is('deleted_at', null)
    .order('week_starting', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Timesheets</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Review and approve employee timesheets.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
            <TableRow>
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">Week Of</TableHead>
              <TableHead className="font-semibold text-right">Total Hours</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timesheets && timesheets.length > 0 ? (
              timesheets.map((ts: any) => (
                <TableRow key={ts.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <TableCell>
                    <div className="font-medium text-zinc-900 dark:text-white">{ts.profiles?.full_name}</div>
                    <div className="text-xs text-zinc-500">{ts.profiles?.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-400" />
                      <span>{formatWeek(ts.week_starting)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                      <Clock className="w-3.5 h-3.5" />
                      {ts.total_hours}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(ts.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/timesheets/${ts.id}`}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                  No timesheets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
