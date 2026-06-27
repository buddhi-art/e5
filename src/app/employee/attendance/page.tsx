import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AttendanceForm } from './attendance-form'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Clock, FileText } from 'lucide-react'

export default async function EmployeeAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch today's record
  const today = new Date().toISOString().split('T')[0]

  const { data: todayRecord } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle()

  // Fetch my attendance history (last 30 days)
  const { data: myAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  const hasCheckedIn = !!todayRecord?.check_in_time
  const hasCheckedOut = !!todayRecord?.check_out_time
  const checkInTime = todayRecord?.check_in_time || null

  function formatTime(isoString: string | null) {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  function formatDuration(checkIn: string, checkOut: string) {
    const start = new Date(checkIn).getTime()
    const end = new Date(checkOut).getTime()
    const diffMs = end - start
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  function truncateSummary(text: string | null, maxLen = 80): string {
    if (!text) return ''
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen) + '...'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Attendance</h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">Check in when you arrive, check out when you leave.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceForm
          hasCheckedIn={hasCheckedIn}
          hasCheckedOut={hasCheckedOut}
          checkInTime={checkInTime}
        />

        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-zinc-900 dark:text-white text-base sm:text-lg">Recent History</CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400 text-sm">Your attendance logs for the last 30 days.</CardDescription>
              </div>
              {hasCheckedIn && hasCheckedOut && checkInTime && todayRecord?.check_out_time && (
                <div className="text-left sm:text-right">
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Today</div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {formatDuration(checkInTime, todayRecord.check_out_time)}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50">
                    <TableHead className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">In</TableHead>
                    <TableHead className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Out</TableHead>
                    <TableHead className="hidden sm:table-cell text-zinc-600 dark:text-zinc-400 whitespace-nowrap min-w-[160px]">Summary</TableHead>
                    <TableHead className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAttendance && myAttendance.length > 0 ? (
                    myAttendance.map((log) => (
                      <TableRow key={log.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50">
                        <TableCell className="font-medium text-zinc-900 dark:text-white whitespace-nowrap text-sm">
                          {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm whitespace-nowrap">
                          {log.check_in_time ? formatTime(log.check_in_time) : '—'}
                        </TableCell>
                        <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm whitespace-nowrap">
                          {log.check_out_time ? formatTime(log.check_out_time) : '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-zinc-500 dark:text-zinc-400 max-w-[200px]">
                          {log.day_summary ? (
                            <details className="group cursor-pointer">
                              <summary className="text-xs text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 select-none">
                                <FileText className="w-3 h-3 shrink-0" />
                                View summary
                              </summary>
                              <div className="mt-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded border border-zinc-200 dark:border-zinc-700 text-xs leading-relaxed whitespace-pre-wrap">
                                {log.day_summary}
                              </div>
                            </details>
                          ) : (
                            <span className="text-zinc-400 text-xs italic">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`border-zinc-300 dark:border-zinc-700 capitalize text-xs ${log.status === 'present' ? 'text-green-400 bg-green-400/10' :
                              log.status === 'absent' ? 'text-red-400 bg-red-400/10' :
                                log.status === 'late' ? 'text-orange-400 bg-orange-400/10' :
                                  'text-blue-400 bg-blue-400/10'
                              }`}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-zinc-500 dark:text-zinc-500">
                        No attendance history found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
