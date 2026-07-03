import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, MapPin, Calendar, Briefcase, Mail, ArrowLeft, User, Globe, Camera, Music2, MessageCircle } from 'lucide-react'
import { normalizeUrl } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EmployeeKpiCard } from '@/components/employee-kpi-card'

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: employee } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'employee')
        .single()

    if (!employee) {
        notFound()
    }

    // Fetch the actual auth email from auth.users (which is always correct)
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id)
    const loginEmail = authUser?.user?.email || employee.email || ''

    // Fetch their assigned tasks
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*, projects(title), subtasks(*)')
        .eq('assigned_to', id)
        .order('created_at', { ascending: false })
        .limit(10)

    // Fetch attendance records
    const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', id)
        .order('date', { ascending: false })
        .limit(10)

    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
    const totalTasks = tasks?.length || 0
    const presentDays = attendance?.filter(a => a.status === 'present').length || 0
    const totalAttendance = attendance?.length || 0

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center gap-4">
                <Link href="/admin/employees">
                    <Button variant="outline" size="icon" className="bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high btn-morph">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-1">{employee.full_name}</h1>
                    <p className="text-on-surface-variant text-sm">Login ID: {loginEmail}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: KPI + Profile */}
                <div className="md:col-span-1 space-y-6">
                    <EmployeeKpiCard employeeId={id} />

                    <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 h-fit morph-fade-in">
                        <CardHeader>
                            <CardTitle className="text-on-surface text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" /> Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="flex justify-center mb-4">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                    {employee.full_name.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">Designation</div>
                                    <Badge variant="outline" className="text-on-surface border-outline-variant bg-surface-container-high">
                                        <Briefcase className="w-3 h-3 mr-1.5 text-primary" />
                                        {employee.designation || 'Not set'}
                                    </Badge>
                                </div>

                                {employee.phone_number && (
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">Phone</div>
                                        <div className="text-on-surface flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-outline" /> {employee.phone_number}
                                        </div>
                                    </div>
                                )}

                                {employee.location && (
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">Location</div>
                                        <div className="text-on-surface flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-outline" /> {employee.location}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">Joined</div>
                                    <div className="text-on-surface flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-outline" />
                                        {employee.joining_date
                                            ? new Date(employee.joining_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                            : new Date(employee.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>

                                {employee.dob && (
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">Date of Birth</div>
                                        <div className="text-on-surface flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-outline" />
                                            {new Date(employee.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                )}

                                {employee.cv_url && (
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">CV / Resume</div>
                                        <div className="text-on-surface flex items-center gap-2 text-sm">
                                            <a href={employee.cv_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                View CV
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {employee.contact_email && (
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">Contact Email</div>
                                        <div className="text-on-surface flex items-center gap-2 text-sm">
                                            <Mail className="w-3.5 h-3.5 text-outline" /> {employee.contact_email}
                                        </div>
                                    </div>
                                )}

                                {(employee.social_urls?.facebook || employee.social_urls?.instagram || employee.social_urls?.tiktok || employee.social_urls?.threads) && (
                                    <div className="pt-4 border-t border-outline-variant">
                                        <div className="text-xs uppercase tracking-wider text-outline font-medium mb-3">Social Media</div>
                                        <div className="flex gap-2">
                                            {employee.social_urls.facebook && (
                                                <a href={normalizeUrl(employee.social_urls.facebook)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-container-high rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                                                    <Globe className="w-4 h-4" />
                                                </a>
                                            )}
                                            {employee.social_urls.instagram && (
                                                <a href={normalizeUrl(employee.social_urls.instagram)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-container-high rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                                                    <Camera className="w-4 h-4" />
                                                </a>
                                            )}
                                            {employee.social_urls.tiktok && (
                                                <a href={normalizeUrl(employee.social_urls.tiktok)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-container-high rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                                                    <Music2 className="w-4 h-4" />
                                                </a>
                                            )}
                                            {employee.social_urls.threads && (
                                                <a href={normalizeUrl(employee.social_urls.threads)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-container-high rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                                                    <MessageCircle className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Stats + Tasks + Attendance */}
                <div className="md:col-span-2 space-y-6">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-1">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-on-surface">{totalTasks}</div>
                                <div className="text-xs text-outline mt-1">Total Tasks</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-2">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-m3-success">{completedTasks}</div>
                                <div className="text-xs text-outline mt-1">Completed</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-3">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-on-surface">{presentDays}</div>
                                <div className="text-xs text-outline mt-1">Present Days</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-4">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-on-surface">{totalAttendance}</div>
                                <div className="text-xs text-outline mt-1">Attendance Records</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Tasks */}
                    <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in">
                        <CardHeader>
                            <CardTitle className="text-on-surface text-lg">Recent Tasks</CardTitle>
                            <CardDescription className="text-on-surface-variant">Latest tasks assigned to {employee.full_name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tasks && tasks.length > 0 ? (
                                <div className="divide-y divide-outline-variant">
                                    {tasks.map(task => {
                                        const completedSubs = task.subtasks?.filter((s: any) => s.is_completed).length || 0
                                        const totalSubs = task.subtasks?.length || 0
                                        return (
                                            <div key={task.id} className="py-3 flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-on-surface text-sm">{task.title}</div>
                                                    <div className="text-xs text-outline mt-0.5">{task.projects?.title} — {task.phase}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {totalSubs > 0 && (
                                                        <span className="text-xs text-outline">{completedSubs}/{totalSubs}</span>
                                                    )}
                                                    <Badge variant="outline" className={`
 ${task.status === 'completed' ? 'bg-m3-success-subtle text-m3-success border-m3-success' : ''}
 ${task.status === 'in_progress' ? 'bg-m3-info-subtle text-m3-info border-m3-info' : ''}
 ${task.status === 'pending' ? 'bg-surface-container-high text-on-surface-variant border-outline-variant' : ''}
 `}>
                                                        {task.status.replace('_', '')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-outline">
                                    No tasks assigned yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Attendance */}
                    <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in">
                        <CardHeader>
                            <CardTitle className="text-on-surface text-lg">Recent Attendance</CardTitle>
                            <CardDescription className="text-on-surface-variant">Latest attendance records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {attendance && attendance.length > 0 ? (
                                <div className="divide-y divide-outline-variant">
                                    {attendance.map(record => (
                                        <div key={record.id} className="py-2 flex items-center justify-between">
                                            <span className="text-sm text-on-surface">
                                                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                            <Badge variant="outline" className={`
 ${record.status === 'present' ? 'bg-m3-success-subtle text-m3-success border-m3-success' : ''}
 ${record.status === 'absent' ? 'bg-m3-error-subtle text-m3-error border-m3-error' : ''}
 ${record.status === 'late' ? 'bg-primary/10 text-primary border-primary' : ''}
 ${record.status === 'half-day' ? 'bg-m3-warning-subtle text-m3-warning border-m3-warning' : ''}
 `}>
                                                {record.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-outline">
                                    No attendance records yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
