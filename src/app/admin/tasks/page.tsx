/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TaskForm } from './task-form'
import { FolderKanban } from 'lucide-react'
import { ClientProjectsAccordion } from './client-projects-accordion'

// Layer 2: ISR - Cache for 5 minutes
export const revalidate = 300

export default async function TasksPage() {
  const supabase = await createClient()

  // Fetch employees (active only - exclude archived)
  const { data: employees, error: employeesErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'employee')
    .is('deleted_at', null)
    .order('full_name')

  // Fetch active projects for the TaskForm
  const { data: allProjects, error: projectsErr } = await supabase
    .from('projects')
    .select('*, clients(company_name)')
    .neq('status', 'completed')
    .order('created_at', { ascending: false })

  const projects = (allProjects || []).filter((p: any) => !p.deleted_at)

  // Fetch clients with nested projects and tasks for the Client-Category View
  const { data: clients, error: clientsErr } = await supabase
    .from('clients')
    .select(`
      id,
      company_name,
      projects(
        id,
        title,
        status,
        deleted_at,
        tasks(
          id,
          status,
          deadline
        )
      )
    `)
    .order('company_name')

  if (employeesErr) console.error('Employees fetch error:', employeesErr.message)
  if (projectsErr) console.error('Projects fetch error:', projectsErr.message)
  if (clientsErr) console.error('Clients fetch error:', clientsErr.message)

  // Filter out archived projects inside the clients
  const clientOverview = (clients || []).map(client => ({
    ...client,
    projects: (client.projects || []).filter((p: any) => p.status !== 'completed' && !p.deleted_at)
  })).filter(client => client.projects.length > 0)

  return (
    <div className="space-y-6">
      <div className="morph-fade-in">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Task Assignment</h1>
        <p className="text-on-surface-variant">Assign work to your team and track progress.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Assignment Form */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-2">
            <CardHeader>
              <CardTitle className="text-on-surface">Assign a Task</CardTitle>
              <CardDescription className="text-on-surface-variant">Delegate work with specific sub-tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskForm projects={projects || []} employees={employees || []} />
            </CardContent>
          </Card>
        </div>

        {/* Client Category View */}
        <div className="xl:col-span-2">
          <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-3">
            <CardHeader>
              <CardTitle className="text-on-surface flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-primary" /> Client Overview
              </CardTitle>
              <CardDescription className="text-on-surface-variant">Track active projects and assignments by client.</CardDescription>
            </CardHeader>

            <ClientProjectsAccordion clients={clientOverview as any} />
          </Card>
        </div>
      </div>
    </div>
  )
}
