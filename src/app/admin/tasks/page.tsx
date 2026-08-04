import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TaskForm } from './task-form'
import { FolderKanban } from 'lucide-react'
import { ClientProjectsAccordion } from './client-projects-accordion'

// Layer 2: ISR - Cache for 5 minutes
export const revalidate = 300

export default async function TasksPage() {
  const supabase = await createClient()

  // Fetch employees, projects, and clients in parallel
  const [employeesResult, allProjectsResult, clientsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .is('deleted_at', null)
      .order('full_name'),
    supabase
      .from('projects')
      .select('*, clients(company_name)')
      .neq('status', 'completed')
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select(`
        id,
        company_name,
        projects(
          id,
          title,
          status,
          deleted_at,
          package_id,
          tasks(
            id,
            title,
            status,
            phase,
            deadline,
            start_date,
            assigned_to,
            logistics,
            subtasks(
              id,
              title,
              is_completed,
              deliverable_id,
              assigned_to,
              sort_order,
              status,
              sub_subtasks(
                id,
                title,
                is_completed
              )
            )
          )
        )
      `)
      .order('company_name'),
  ])

  const { data: employees, error: employeesErr } = employeesResult
  const { data: allProjects, error: projectsErr } = allProjectsResult
  const { data: clients, error: clientsErr } = clientsResult

  const projects = (allProjects || []).filter((p: { deleted_at?: string | null }) => !p.deleted_at)

  if (employeesErr) console.error('Employees fetch error:', employeesErr.message)
  if (projectsErr) console.error('Projects fetch error:', projectsErr.message)
  if (clientsErr) console.error('Clients fetch error:', clientsErr.message)

  // Filter out archived projects inside the clients
  const clientOverview = (clients || []).map(client => ({
    ...client,
    projects: (client.projects || []).filter((p: { status?: string; deleted_at?: string | null }) => p.status !== 'completed' && !p.deleted_at)
  })).filter(client => client.projects.length > 0)

  return (
    <div className="space-y-6">
      <div className="morph-fade-in">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Task Assignment</h1>
        <p className="text-on-surface-variant">Assign work to your team and track deliverables, sub-tasks, and progress — all connected to your project packages.</p>
      </div>

      <div className="space-y-6">
        {/* The task workspace remains full width so Phase 2/3 operations fit on 13–15 inch laptop displays. */}
        <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-2">
          <CardHeader>
            <CardTitle className="text-on-surface">Assign a Task</CardTitle>
            <CardDescription className="text-on-surface-variant">Delegate work. Deliverables from the project package auto-link as subtasks — phase time fields are managed in the logistics section below.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskForm projects={projects || []} employees={employees || []} />
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-3">
          <CardHeader>
            <CardTitle className="text-on-surface flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" /> Client Overview
            </CardTitle>
            <CardDescription className="text-on-surface-variant">Expand a client to see projects, tasks, deliverable subtasks, and actionable items — all inline.</CardDescription>
          </CardHeader>

          <CardContent>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <ClientProjectsAccordion clients={clientOverview as any} employees={employees || []} />
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
