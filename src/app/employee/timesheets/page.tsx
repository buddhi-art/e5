import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Plus, FileText } from 'lucide-react'

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

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

export default async function EmployeeTimesheetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const currentMonday = getMonday(new Date()).toISOString().split('T')[0]

  // Fetch all timesheets for this user
  const { data: timesheets } = await supabase
    .from('timesheets')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('week_starting', { ascending: false })

  // Check if current week has a timesheet
  const currentWeekTs = timesheets?.find(t => t.week_starting === currentMonday)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">My Timesheets</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Track your working hours by week.</p>
        </div>
        <Button render={<Link href={`/employee/timesheets/new?week=${currentMonday}`} />} className="bg-sky-500 hover:bg-sky-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Log Hours
        </Button>
      </div>

      {/* Current week card */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm border-l-4 border-l-sky-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-lg font-semibold">Current Week</CardTitle>
          {currentWeekTs ? getStatusBadge(currentWeekTs.status) : <Badge variant="outline" className="text-zinc-400">Not Started</Badge>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 mb-3">{formatWeek(currentMonday)}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <Clock className="w-4 h-4" />
              <span className="text-lg font-semibold">{currentWeekTs ? `${currentWeekTs.total_hours}h` : '0h'}</span>
              <span className="text-sm text-zinc-500">logged</span>
            </div>
            <Button
              variant="outline"
              render={<Link href={`/employee/timesheets/new?week=${currentMonday}`} />}
              className="text-sky-600 border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30"
            >
              {currentWeekTs ? 'Continue' : 'Start Logging'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Past timesheets */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">History</h2>
        <div className="space-y-2">
          {timesheets && timesheets.length > 0 ? (
            timesheets
              .filter(t => t.week_starting !== currentMonday)
              .map((ts: any) => (
                <div key={ts.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{formatWeek(ts.week_starting)}</p>
                      <p className="text-sm text-zinc-500">{ts.total_hours}h logged</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(ts.status)}
                    {(ts.status === 'draft' || ts.status === 'rejected') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/employee/timesheets/new?week=${ts.week_starting}`} />}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-10 text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              No timesheets yet. Start logging hours for the current week!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
