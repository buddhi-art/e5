import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserSquare2, FolderKanban, CheckSquare, ClipboardList } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Fetch all summary data in parallel
  const [
    { count: employeeCount, error: empErr },
    { count: clientCount, error: cliErr },
    { count: activeProjectCount, error: projErr },
    { data: recentTasks, error: taskErr },
    { data: todayAttendance, error: attErr },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employee'),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).neq('status', 'completed'),
    supabase.from('tasks').select('*, profiles(full_name), projects(title, clients(company_name))').order('created_at', { ascending: false }).limit(5),
    supabase.from('attendance').select('*, profiles(full_name)').eq('date', today).order('created_at', { ascending: false }),
  ])

  // Log any errors for debugging
  if (empErr) console.error('Employee count error:', empErr.message)
  if (cliErr) console.error('Client count error:', cliErr.message)
  if (projErr) console.error('Project count error:', projErr.message)
  if (taskErr) console.error('Task fetch error:', taskErr.message)
  if (attErr) console.error('Attendance fetch error:', attErr.message)

  const taskCount = recentTasks?.length || 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Dashboard Overview</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Welcome to the E5 Chronicles Admin Portal.</p>
      </div>

      {/* 6 Clickable Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/employees" className="group">
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Employees</CardTitle>
              <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">{employeeCount || 0}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/clients" className="group">
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Clients</CardTitle>
              <UserSquare2 className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">{clientCount || 0}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/projects" className="group">
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Active Projects</CardTitle>
              <FolderKanban className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">{activeProjectCount || 0}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/tasks" className="group">
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Recent Tasks</CardTitle>
              <CheckSquare className="h-5 w-5 text-violet-500 dark:text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">{taskCount}</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">latest assignments</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/attendance" className="group">
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Today's Attendance</CardTitle>
              <ClipboardList className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">{todayAttendance?.length || 0}</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">total entries today</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-900 dark:text-white">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks && recentTasks.length > 0 ? (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {recentTasks.map((task) => (
                  <div key={task.id} className="py-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-4">
                      <div className="font-medium text-zinc-900 dark:text-white text-sm truncate">
                        {(() => {
                          const match = task.title.match(/^E5_Task_(\d+)\s*-\s*(.*)/);
                          const clientName = task.projects?.clients?.company_name || 'Client';
                          const projectName = task.projects?.title || 'Project';
                          if (match) {
                            return `E5 - ${clientName} - ${projectName} - ${match[2]} - ${match[1]}`;
                          }
                          return `E5 - ${clientName} - ${projectName} - ${task.title}`;
                        })()}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                        {task.profiles?.full_name || 'Unassigned'} &middot; {task.projects?.title || 'No project'}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${task.status === 'completed' ? 'text-green-600 dark:text-green-400 bg-green-400/10 border-green-500/20' :
                      task.status === 'in_progress' ? 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20' :
                        'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700'
                      }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-500">No recent tasks found.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-900 dark:text-white">Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance && todayAttendance.length > 0 ? (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {todayAttendance.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="py-2.5 flex items-center justify-between">
                    <div className="font-medium text-zinc-900 dark:text-white text-sm">{entry.profiles?.full_name || 'Unknown'}</div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">
                      {new Date(entry.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {todayAttendance.length > 8 && (
                  <div className="py-2 text-center text-xs text-zinc-500 dark:text-zinc-500">
                    +{todayAttendance.length - 8} more
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-500">No attendance records for today.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
