import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, CalendarDays } from 'lucide-react'
import Link from 'next/link'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type AttendanceRecord = {
  id: string
  user_id: string
  date: string
  status: string
  created_at: string
  profiles: { full_name: string; designation: string } | null
}

export default async function AttendancePage() {
  const supabase = await createClient()

  // Fetch all attendance records with profile info
  const { data: rawLogs } = await supabase
    .from('attendance')
    .select(`
      *,
      profiles ( full_name, designation )
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  const attendanceLogs = (rawLogs || []) as AttendanceRecord[]

  // Group by year-month
  const monthsMap = new Map<string, { year: number; month: number; label: string; records: AttendanceRecord[] }>()

  for (const log of attendanceLogs) {
    const d = new Date(log.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthsMap.has(key)) {
      monthsMap.set(key, {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        records: [],
      })
    }
    monthsMap.get(key)!.records.push(log)
  }

  const months = Array.from(monthsMap.entries()).sort((a, b) => b[0].localeCompare(a[0]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Attendance</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Monthly attendance records — click a month to view details.</p>
      </div>

      {months.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {months.map(([key, month]) => {
            const presentCount = month.records.filter(r => r.status === 'present').length
            const lateCount = month.records.filter(r => r.status === 'late').length
            const halfDayCount = month.records.filter(r => r.status === 'half-day').length
            const absentCount = month.records.filter(r => r.status === 'absent').length

            return (
              <Link key={key} href={`/admin/attendance/${key}`}>
                <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer group h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-zinc-900 dark:text-white text-base">{month.label}</CardTitle>
                      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
                    </div>
                    <CardDescription className="text-zinc-500 dark:text-zinc-500">
                      {month.records.length} record{month.records.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="bg-green-400/10 text-green-500 dark:text-green-400 border-green-500/20 text-xs">
                        {presentCount} present
                      </Badge>
                      {lateCount > 0 && (
                        <Badge variant="outline" className="bg-orange-400/10 text-orange-400 border-orange-500/20 text-xs">
                          {lateCount} late
                        </Badge>
                      )}
                      {halfDayCount > 0 && (
                        <Badge variant="outline" className="bg-blue-400/10 text-blue-400 border-blue-500/20 text-xs">
                          {halfDayCount} half-day
                        </Badge>
                      )}
                      {absentCount > 0 && (
                        <Badge variant="outline" className="bg-red-400/10 text-red-400 border-red-500/20 text-xs">
                          {absentCount} absent
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardContent className="text-center py-12">
            <CalendarDays className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <div className="text-zinc-500 dark:text-zinc-500 mb-1">No attendance records found.</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Records will appear here once employees start marking attendance.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
