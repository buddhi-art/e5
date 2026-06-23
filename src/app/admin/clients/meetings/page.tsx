import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, ArrowLeft, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ClientMeetingDialog } from '../[id]/client-meeting-dialog'

export default async function ClientMeetingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/employee/dashboard')

    // Fetch all meetings with client info
    const { data: meetings } = await supabase
        .from('client_meetings')
        .select(`
      *,
      clients(company_name, id)
    `)
        .order('meeting_date', { ascending: false })

    // Group meetings by status
    const upcoming = (meetings || []).filter((m: any) => m.status === 'scheduled' && new Date(m.meeting_date) >= new Date())
    const past = (meetings || []).filter((m: any) => m.status !== 'scheduled' || new Date(m.meeting_date) < new Date())

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Client Meetings</h1>
                    <p className="text-sm text-zinc-500">Schedule and track all meetings with clients.</p>
                </div>
                <Link href="/admin/clients" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Clients
                </Link>
            </div>

            {(!meetings || meetings.length === 0) ? (
                <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <CalendarDays className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 mb-2">No meetings scheduled</h3>
                    <p className="text-sm text-zinc-500 mb-6">Schedule a meeting from any client detail page.</p>
                    <Link href="/admin/clients" className="inline-flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400 hover:underline">
                        <Plus className="w-4 h-4" />
                        Go to Clients
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Upcoming Meetings */}
                    {upcoming.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-sky-500" />
                                Upcoming ({upcoming.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {upcoming.map((meeting: any) => (
                                    <Link key={meeting.id} href={`/admin/clients/${meeting.client_id}`} className="block group">
                                        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-sky-500 dark:hover:border-sky-500 transition-colors h-full">
                                            <CardContent className="p-5 space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-medium text-zinc-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                                        {meeting.title}
                                                    </h3>
                                                    <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 flex-shrink-0">
                                                        {meeting.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-zinc-500">
                                                    {meeting.clients?.company_name || 'Unknown client'}
                                                </p>
                                                <div className="text-xs text-zinc-500 space-y-1">
                                                    <p>{format(new Date(meeting.meeting_date), 'MMM d, yyyy h:mm a')}</p>
                                                    {meeting.duration_minutes && <p>Duration: {meeting.duration_minutes} min</p>}
                                                    {meeting.location && <p>📍 {meeting.location}</p>}
                                                </div>
                                                {meeting.notes && (
                                                    <p className="text-xs text-zinc-500 line-clamp-2">{meeting.notes}</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Past Meetings */}
                    {past.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 text-zinc-500">
                                <CalendarDays className="w-5 h-5" />
                                Past ({past.length})
                            </h2>
                            <div className="space-y-3">
                                {past.map((meeting: any) => (
                                    <Link key={meeting.id} href={`/admin/clients/${meeting.client_id}`} className="block group">
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-800 mt-0.5">
                                                    <CalendarDays className="w-4 h-4 text-zinc-500" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{meeting.title}</p>
                                                    <p className="text-xs text-zinc-500 mt-0.5">{meeting.clients?.company_name}</p>
                                                    <p className="text-xs text-zinc-500">{format(new Date(meeting.meeting_date), 'MMM d, yyyy h:mm a')}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`
                        ${meeting.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}
                        ${meeting.status === 'cancelled' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700' : ''}
                        ${meeting.status === 'scheduled' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : ''}
                      `}>
                                                {meeting.status}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
