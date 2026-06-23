import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TimesheetForm } from './timesheet-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function NewTimesheetPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const weekParam = params.week

  // Calculate current Monday if no week provided
  function getMonday(d: Date): string {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    date.setDate(diff)
    return date.toISOString().split('T')[0]
  }

  const weekStarting = weekParam || getMonday(new Date())

  // Check for existing timesheet this week
  const { data: existingTs } = await supabase
    .from('timesheets')
    .select('*, timesheet_entries(*)')
    .eq('user_id', user.id)
    .eq('week_starting', weekStarting)
    .is('deleted_at', null)
    .single()

  // Fetch projects this employee is assigned to (via tasks)
  const { data: assignedTasks } = await supabase
    .from('tasks')
    .select('project_id, projects(id, title)')
    .eq('assigned_to', user.id)
    .is('deleted_at', null)

  // Deduplicate projects
  const projectMap = new Map<string, string>()
  assignedTasks?.forEach((t: any) => {
    if (t.projects && t.project_id) {
      projectMap.set(t.project_id, t.projects.title)
    }
  })
  const projects = Array.from(projectMap.entries()).map(([id, title]) => ({ id, title }))

  // Also fetch all tasks grouped by project for dropdowns
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('id, title, project_id')
    .eq('assigned_to', user.id)
    .is('deleted_at', null)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" render={<Link href="/employee/timesheets" />} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Log Hours</h1>
      </div>

      {existingTs?.status === 'rejected' && existingTs.notes && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800">
          <p className="font-semibold mb-1">⚠️ This timesheet was rejected</p>
          <p className="text-sm">{existingTs.notes}</p>
        </div>
      )}

      <TimesheetForm
        weekStarting={weekStarting}
        existingTimesheet={existingTs}
        existingEntries={existingTs?.timesheet_entries || []}
        projects={projects}
        tasks={allTasks || []}
      />
    </div>
  )
}
