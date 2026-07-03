import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, CalendarDays } from 'lucide-react'
import Link from 'next/link'

// Layer 2: ISR — Cache for 5 minutes
export const revalidate = 300

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

  const { data: rawLogs } = await supabase
    .from('attendance')
    .select(`*, profiles ( full_name, designation )`)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  const attendanceLogs = (rawLogs || []) as AttendanceRecord[]

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
      <div className="morph-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">Attendance</h1>
        <p className="text-sm sm:text-base text-on-surface-variant">Monthly attendance records &mdash; click a month to view details.</p>
      </div>

      {months.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {months.map(([key, month], idx) => {
            const presentCount = month.records.filter(r => r.status === 'present').length
            const lateCount = month.records.filter(r => r.status === 'late').length
            const halfDayCount = month.records.filter(r => r.status === 'half-day').length
            const absentCount = month.records.filter(r => r.status === 'absent').length

            return (
              <Link key={key} href={`/admin/attendance/${key}`}>
                <Card className="bg-surface-container-lowest border-outline-variant/40 hover:bg-surface-container-high transition-all duration-200 cursor-pointer group h-full card-morph morph-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground text-sm sm:text-base">{month.label}</CardTitle>
                      <ChevronRight className="w-4 h-4 text-outline group-hover:text-foreground transition-colors shrink-0 icon-morph" />
                    </div>
                    <CardDescription className="text-on-surface-variant text-xs sm:text-sm">
                      {month.records.length} record{month.records.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 sm:pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="bg-primary-container/40 text-primary border-primary/30 text-xs">
                        {presentCount} present
                      </Badge>
                      {lateCount > 0 && (
                        <Badge variant="outline" className="bg-m3-warning-subtle text-m3-warning border-m3-warning/40 text-xs">
                          {lateCount} late
                        </Badge>
                      )}
                      {halfDayCount > 0 && (
                        <Badge variant="outline" className="bg-tertiary-container/40 text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-outline)]/40 text-xs">
                          {halfDayCount} half-day
                        </Badge>
                      )}
                      {absentCount > 0 && (
                        <Badge variant="outline" className="bg-error-container/40 text-[var(--md-sys-color-on-error-container)] border-[var(--md-sys-color-outline)]/40 text-xs">
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
        <Card className="bg-surface-container-lowest border-outline-variant/40 card-morph morph-fade-in">
          <CardContent className="text-center py-12">
            <CalendarDays className="w-10 h-10 text-outline mx-auto mb-3" />
            <div className="text-on-surface-variant mb-1">No attendance records found.</div>
            <p className="text-sm text-outline">Records will appear here once employees start marking attendance.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
