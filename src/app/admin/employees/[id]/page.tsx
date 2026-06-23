import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, MapPin, Calendar, Briefcase, Mail, ArrowLeft, User, Globe, Camera, Music2, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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
                    <Button variant="outline" size="icon" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">{employee.full_name}</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Login ID: {loginEmail}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-zinc-900 dark:text-white text-lg flex items-center gap-2">
                            <User className="w-5 h-5 text-sky-500" /> Profile
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
                                <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">Designation</div>
                                <Badge variant="outline" className="text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50">
                                    <Briefcase className="w-3 h-3 mr-1.5 text-sky-500" />
                                    {employee.designation || 'Not set'}
                                </Badge>
                            </div>

                            {employee.phone_number && (
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">Phone</div>
                                    <div className="text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-zinc-500" /> {employee.phone_number}
                                    </div>
                                </div>
                            )}

                            {employee.location && (
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">Location</div>
                                    <div className="text-zinc-900 dark:text-white flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-zinc-500" /> {employee.location}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">Joined</div>
                                <div className="text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                                    {employee.joining_date
                                        ? new Date(employee.joining_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                        : new Date(employee.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>

                            {employee.dob && (
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">Date of Birth</div>
                                    <div className="text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                                        {new Date(employee.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                            )}

                            {employee.cv_url && (
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">CV / Resume</div>
                                    <div className="text-zinc-900 dark:text-white flex items-center gap-2 text-sm">
                                        <a href={employee.cv_url} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">
                                            View CV
                                        </a>
                                    </div>
                                </div>
                            )}

                            {employee.contact_email && (
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">Contact Email</div>
                                    <div className="text-zinc-900 dark:text-white flex items-center gap-2 text-sm">
                                        <Mail className="w-3.5 h-3.5 text-zinc-500" /> {employee.contact_email}
                                    </div>
                                </div>
                            )}

                            {/* Socials */}
                            {(employee.social_urls?.facebook || employee.social_urls?.instagram || employee.social_urls?.tiktok || employee.social_urls?.threads) && (
                                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
                                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-3">Social Media</div>
                                    <div className="flex gap-2">
                                        {employee.social_urls.facebook && (
                                            <a href={employee.social_urls.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                                <Globe className="w-4 h-4" />
                                            </a>
                                        )}
                                        {employee.social_urls.instagram && (
                                            <a href={employee.social_urls.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                                <Camera className="w-4 h-4" />
                                            </a>
                                        )}
                                        {employee.social_urls.tiktok && (
                                            <a href={employee.social_urls.tiktok} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                                <Music2 className="w-4 h-4" />
                                            </a>
                                        )}
                                        {employee.social_urls.threads && (
                                            <a href={employee.social_urls.threads} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                                <MessageCircle className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Stats & Tasks */}
                <div className="md:col-span-2 space-y-6">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{totalTasks}</div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Total Tasks</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-emerald-500">{completedTasks}</div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Completed</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{presentDays}</div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Present Days</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{totalAttendance}</div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Attendance Records</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Tasks */}
                    <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-zinc-900 dark:text-white text-lg">Recent Tasks</CardTitle>
                            <CardDescription className="text-zinc-600 dark:text-zinc-400">Latest tasks assigned to {employee.full_name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tasks && tasks.length > 0 ? (
                                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {tasks.map(task => {
                                        const completedSubs = task.subtasks?.filter((s: any) => s.is_completed).length || 0
                                        const totalSubs = task.subtasks?.length || 0
                                        return (
                                            <div key={task.id} className="py-3 flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-zinc-900 dark:text-white text-sm">{task.title}</div>
                                                    <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{task.projects?.title} — {task.phase}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {totalSubs > 0 && (
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-500">{completedSubs}/{totalSubs}</span>
                                                    )}
                                                    <Badge variant="outline" className={`
                            ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                            ${task.status === 'in_progress' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' : ''}
                            ${task.status === 'pending' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700' : ''}
                          `}>
                                                        {task.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-zinc-500 dark:text-zinc-500">
                                    No tasks assigned yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Attendance */}
                    <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-zinc-900 dark:text-white text-lg">Recent Attendance</CardTitle>
                            <CardDescription className="text-zinc-600 dark:text-zinc-400">Latest attendance records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {attendance && attendance.length > 0 ? (
                                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {attendance.map(record => (
                                        <div key={record.id} className="py-2 flex items-center justify-between">
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                            <Badge variant="outline" className={`
                        ${record.status === 'present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                        ${record.status === 'absent' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                        ${record.status === 'late' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''}
                        ${record.status === 'half-day' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : ''}
                      `}>
                                                {record.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-zinc-500 dark:text-zinc-500">
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
