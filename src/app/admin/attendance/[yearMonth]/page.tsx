import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CalendarDays, Clock, FileText } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Layer 2: ISR — Cache for 5 minutes
export const revalidate = 300

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type AttendanceRecord = {
 id: string
 user_id: string
 date: string
 status: string
 created_at: string
 check_in_time: string | null
 check_out_time: string | null
 day_summary: string | null
 profiles: { full_name: string; designation: string } | null
}

function formatTime(iso: string | null) {
 if (!iso) return '\u2014'
 return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function truncateSummary(text: string | null, maxLen = 120): string {
 if (!text) return '\u2014'
 if (text.length <= maxLen) return text
 return text.slice(0, maxLen) + '...'
}

function wordCount(text: string | null): number {
 if (!text) return 0
 return text.trim().split(/\s+/).filter(Boolean).length
}

export default async function AttendanceMonthPage({ params }: { params: Promise<{ yearMonth: string }> }) {
 const { yearMonth } = await params

 if (!/^\d{4}-\d{2}$/.test(yearMonth)) notFound()

 const [yearStr, monthStr] = yearMonth.split('-')
 const year = parseInt(yearStr)
 const month = parseInt(monthStr)
 if (month < 1 || month > 12) notFound()

 const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`
 const startDate = `${yearStr}-${monthStr}-01`
 const endDay = new Date(year, month, 0).getDate()
 const endDate = `${yearStr}-${monthStr}-${String(endDay).padStart(2, '0')}`

 const supabase = await createClient()
 const { data: rawLogs } = await supabase
 .from('attendance')
 .select(`*, profiles ( full_name, designation )`)
 .gte('date', startDate)
 .lte('date', endDate)
 .order('date', { ascending: false })
 .order('created_at', { ascending: false })

 const attendanceLogs = (rawLogs || []) as AttendanceRecord[]
 const presentCount = attendanceLogs.filter(r => r.status === 'present').length
 const lateCount = attendanceLogs.filter(r => r.status === 'late').length
 const halfDayCount = attendanceLogs.filter(r => r.status === 'half-day').length
 const absentCount = attendanceLogs.filter(r => r.status === 'absent').length

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center gap-4 morph-fade-in">
 <Link href="/admin/attendance">
 <Button variant="outline" size="icon" className="bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-high shrink-0 btn-morph">
 <ArrowLeft className="w-4 h-4" />
 </Button>
 </Link>
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1">{monthLabel}</h1>
 <p className="text-sm sm:text-base text-on-surface-variant">{attendanceLogs.length} record{attendanceLogs.length !== 1 ? 's' : ''} for this month.</p>
 </div>
 </div>

 <div className="flex flex-wrap gap-2 sm:gap-3 morph-fade-in morph-delay-2">
 <Badge variant="outline" className="bg-primary-container/40 text-primary border-primary/30 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm">{presentCount} present</Badge>
 {lateCount > 0 && <Badge variant="outline" className="bg-m3-warning/10 text-m3-warning border-m3-warning px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm">{lateCount} late</Badge>}
 {halfDayCount > 0 && <Badge variant="outline" className="bg-tertiary-container/40 text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-outline)]/40 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm">{halfDayCount} half-day</Badge>}
 {absentCount > 0 && <Badge variant="outline" className="bg-error-container/40 text-[var(--md-sys-color-on-error-container)] border-[var(--md-sys-color-outline)]/40 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm">{absentCount} absent</Badge>}
 </div>

 <Card className="bg-surface-container-lowest border-outline-variant/40 card-morph morph-fade-in morph-delay-3">
 <CardHeader className="p-4 sm:p-6">
 <CardTitle className="text-foreground flex items-center gap-2 text-lg sm:text-xl">
 <CalendarDays className="w-5 h-5 text-primary shrink-0" />
 Attendance Register &mdash; {monthLabel}
 </CardTitle>
 <CardDescription className="text-on-surface-variant text-sm">
 Check-in / check-out times and day summaries for all employees.
 </CardDescription>
 </CardHeader>
 <CardContent className="p-0 sm:p-6 sm:pt-0">
 {attendanceLogs.length > 0 ? (
 <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
 <Table>
 <TableHeader>
 <TableRow className="border-outline-variant/30 hover:bg-surface-container-high">
 <TableHead className="text-on-surface-variant whitespace-nowrap">Date</TableHead>
 <TableHead className="text-on-surface-variant whitespace-nowrap">Employee</TableHead>
 <TableHead className="hidden sm:table-cell text-on-surface-variant whitespace-nowrap">Designation</TableHead>
 <TableHead className="text-on-surface-variant whitespace-nowrap">In</TableHead>
 <TableHead className="text-on-surface-variant whitespace-nowrap">Out</TableHead>
 <TableHead className="text-on-surface-variant whitespace-nowrap">Status</TableHead>
 <TableHead className="text-on-surface-variant whitespace-nowrap min-w-[200px]">Day Summary</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {attendanceLogs.map((log) => (
 <TableRow key={log.id} className="border-outline-variant/30 hover:bg-surface-container-high">
 <TableCell className="font-medium text-foreground whitespace-nowrap text-sm">
 {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
 </TableCell>
 <TableCell className="text-foreground whitespace-nowrap text-sm">
 <div className="font-medium">{log.profiles?.full_name || 'Unknown'}</div>
 </TableCell>
 <TableCell className="hidden sm:table-cell text-on-surface-variant text-sm capitalize whitespace-nowrap">
 {log.profiles?.designation || '\u2014'}
 </TableCell>
 <TableCell className="text-sm whitespace-nowrap">
 {log.check_in_time ? (
 <span className="inline-flex items-center gap-1 text-[var(--md-sys-color-tertiary)] font-medium">
 <Clock className="w-3 h-3 shrink-0" />
 {formatTime(log.check_in_time)}
 </span>
 ) : (
 <span className="text-outline">\u2014</span>
 )}
 </TableCell>
 <TableCell className="text-sm whitespace-nowrap">
 {log.check_out_time ? (
 <span className="inline-flex items-center gap-1 text-m3-warning font-medium">
 <Clock className="w-3 h-3 shrink-0" />
 {formatTime(log.check_out_time)}
 </span>
 ) : (
 <span className="text-outline">\u2014</span>
 )}
 </TableCell>
 <TableCell className="whitespace-nowrap">
 <Badge
 variant="outline"
 className={`capitalize text-xs ${log.status === 'present' ? 'text-primary bg-primary-container/40 border-primary/30' :
 log.status === 'absent' ? 'text-destructive bg-error-container/40 border-destructive/30' :
 log.status === 'late' ? 'text-m3-warning bg-m3-warning/10 border-m3-warning' :
 'text-[var(--md-sys-color-on-tertiary-container)] bg-tertiary-container/40 border-[var(--md-sys-color-outline)]/40'
 }`}
 >
 {log.status}
 </Badge>
 </TableCell>
 <TableCell className="text-sm text-on-surface-variant max-w-[280px]">
 {log.day_summary ? (
 <div className="group relative">
 <p className="text-xs sm:text-sm leading-relaxed line-clamp-2">
 {truncateSummary(log.day_summary)}
 </p>
 {log.day_summary.length > 120 && (
 <>
 <details className="group mt-1">
 <summary className="text-xs text-primary cursor-pointer hover:underline inline-flex items-center gap-1 select-none">
 <FileText className="w-3 h-3" />
 Read full summary ({wordCount(log.day_summary)} words)
 </summary>
 <div className="mt-2 p-3 bg-surface-container-high rounded-lg border border-outline-variant/30 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
 {log.day_summary}
 </div>
 </details>
 </>
 )}
 </div>
 ) : (
 <span className="text-outline text-xs italic">No summary</span>
 )}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 ) : (
 <div className="text-center py-12">
 <CalendarDays className="w-10 h-10 text-outline mx-auto mb-3" />
 <div className="text-on-surface-variant mb-1">No attendance records for {monthLabel}.</div>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}
