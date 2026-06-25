import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type AttendanceRecord = {
    id: string
    user_id: string
    date: string
    status: string
    created_at: string
    check_in_time: string | null
    check_out_time: string | null
    profiles: { full_name: string; designation: string } | null
}

function formatTime(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
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
            <div className="flex items-center gap-4">
                <Link href="/admin/attendance">
                    <Button variant="outline" size="icon" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">{monthLabel}</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">{attendanceLogs.length} record{attendanceLogs.length !== 1 ? 's' : ''} for this month.</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="bg-green-400/10 text-green-600 dark:text-green-400 border-green-500/20 px-3 py-1.5 text-sm">{presentCount} present</Badge>
                {lateCount > 0 && <Badge variant="outline" className="bg-orange-400/10 text-orange-600 dark:text-orange-400 border-orange-500/20 px-3 py-1.5 text-sm">{lateCount} late</Badge>}
                {halfDayCount > 0 && <Badge variant="outline" className="bg-blue-400/10 text-blue-600 dark:text-blue-400 border-blue-500/20 px-3 py-1.5 text-sm">{halfDayCount} half-day</Badge>}
                {absentCount > 0 && <Badge variant="outline" className="bg-red-400/10 text-red-600 dark:text-red-400 border-red-500/20 px-3 py-1.5 text-sm">{absentCount} absent</Badge>}
            </div>

            <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        Attendance Register — {monthLabel}
                    </CardTitle>
                    <CardDescription className="text-zinc-600 dark:text-zinc-400">
                        Check-in / check-out times for all employees.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {attendanceLogs.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50">
                                    <TableHead className="text-zinc-600 dark:text-zinc-400">Date</TableHead>
                                    <TableHead className="text-zinc-600 dark:text-zinc-400">Employee</TableHead>
                                    <TableHead className="text-zinc-600 dark:text-zinc-400">Designation</TableHead>
                                    <TableHead className="text-zinc-600 dark:text-zinc-400">Check In</TableHead>
                                    <TableHead className="text-zinc-600 dark:text-zinc-400">Check Out</TableHead>
                                    <TableHead className="text-zinc-600 dark:text-zinc-400">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceLogs.map((log) => (
                                    <TableRow key={log.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50">
                                        <TableCell className="font-medium text-zinc-900 dark:text-white">
                                            {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="text-zinc-700 dark:text-zinc-300">
                                            <div className="font-medium">{log.profiles?.full_name || 'Unknown'}</div>
                                        </TableCell>
                                        <TableCell className="text-zinc-500 dark:text-zinc-500 text-sm capitalize">
                                            {log.profiles?.designation || '—'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {log.check_in_time ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(log.check_in_time)}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-400">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {log.check_out_time ? (
                                                <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(log.check_out_time)}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-400">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`capitalize ${log.status === 'present' ? 'text-green-600 dark:text-green-400 bg-green-400/10 border-green-500/20' :
                                                    log.status === 'absent' ? 'text-red-600 dark:text-red-400 bg-red-400/10 border-red-500/20' :
                                                        log.status === 'late' ? 'text-orange-600 dark:text-orange-400 bg-orange-400/10 border-orange-500/20' :
                                                            'text-blue-600 dark:text-blue-400 bg-blue-400/10 border-blue-500/20'
                                                    }`}
                                            >
                                                {log.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12">
                            <CalendarDays className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                            <div className="text-zinc-500 dark:text-zinc-500 mb-1">No attendance records for {monthLabel}.</div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
