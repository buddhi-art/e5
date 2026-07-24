/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
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

    // Fetch all meetings with client info & all clients for scheduling
    const [{ data: meetings }, { data: allClients }] = await Promise.all([
      supabase.from('client_meetings').select('*, clients(company_name, id)').order('meeting_date', { ascending: false }),
      supabase.from('clients').select('id, company_name').is('deleted_at', null).order('company_name', { ascending: true })
    ])

    // Group meetings by status
    const upcoming = (meetings || []).filter((m: any) => m.status === 'scheduled' && new Date(m.meeting_date) >= new Date())
    const past = (meetings || []).filter((m: any) => m.status !== 'scheduled' || new Date(m.meeting_date) < new Date())

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-on-surface">Client Meetings</h1>
                    <p className="text-sm text-outline">Schedule and track all meetings with clients.</p>
                </div>
                <div className="flex items-center gap-3">
                    <ClientMeetingDialog clients={allClients || []} />
                    <Link href="/admin/clients" className="inline-flex items-center gap-2 text-sm text-outline hover:text-on-surface transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Clients
                    </Link>
                </div>
            </div>

            {(!meetings || meetings.length === 0) ? (
                <div className="text-center py-16 border border-dashed border-outline-variant rounded-xl space-y-4">
                    <CalendarDays className="w-12 h-12 text-outline mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-on-surface-variant">No meetings scheduled</h3>
                      <p className="text-sm text-outline">Schedule a meeting with any of your clients.</p>
                    </div>
                    <div className="flex justify-center">
                      <ClientMeetingDialog clients={allClients || []} />
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Upcoming Meetings */}
                    {upcoming.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-m3-info" />
                                Upcoming ({upcoming.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {upcoming.map((meeting: any) => (
                                    <Link key={meeting.id} href={`/admin/clients/${meeting.client_id}`} className="block group">
                                        <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 card-morph hover:border-primary transition-colors h-full morph-fade-in">
                                            <CardContent className="p-5 space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-medium text-on-surface group-hover:text-primary transition-colors">
                                                        {meeting.title}
                                                    </h3>
                                                    <Badge variant="outline" className="bg-m3-info-subtle text-m3-info border-m3-info flex-shrink-0">
                                                        {meeting.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-outline">
                                                    {meeting.clients?.company_name || 'Unknown client'}
                                                </p>
                                                <div className="text-xs text-outline space-y-1">
                                                    <p>{format(new Date(meeting.meeting_date), 'MMM d, yyyy h:mm a')}</p>
                                                    {meeting.duration_minutes && <p>Duration: {meeting.duration_minutes} min</p>}
                                                    {meeting.location && <p>📍 {meeting.location}</p>}
                                                </div>
                                                {meeting.notes && (
                                                    <p className="text-xs text-outline line-clamp-2">{meeting.notes}</p>
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
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-outline">
                                <CalendarDays className="w-5 h-5" />
                                Past ({past.length})
                            </h2>
                            <div className="space-y-3">
                                {past.map((meeting: any) => (
                                    <Link key={meeting.id} href={`/admin/clients/${meeting.client_id}`} className="block group">
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-outline-variant/50 bg-surface-container-lowest card-morph hover:border-primary transition-colors morph-fade-in">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-md bg-surface-container-high mt-0.5">
                                                    <CalendarDays className="w-4 h-4 text-outline" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-on-surface group-hover:text-primary transition-colors">{meeting.title}</p>
                                                    <p className="text-xs text-outline mt-0.5">{meeting.clients?.company_name}</p>
                                                    <p className="text-xs text-outline">{format(new Date(meeting.meeting_date), 'MMM d, yyyy h:mm a')}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`
                        ${meeting.status === 'completed' ? 'bg-m3-success-subtle text-m3-success border-m3-success' : ''}
                        ${meeting.status === 'cancelled' ? 'bg-surface-container-high text-on-surface-variant border-outline-variant' : ''}
                        ${meeting.status === 'scheduled' ? 'bg-m3-warning-subtle text-m3-warning border-m3-warning' : ''}
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
