import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmployeeExpenseForm } from './employee-expense-form'

export default async function NewEmployeeExpensePage() {
  const supabase = await createClient()

  // Verify access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch projects where the employee has assigned tasks
  const { data: userTasks } = await supabase
    .from('tasks')
    .select('project_id, projects(id, title)')
    .eq('assigned_to', user.id)
    .is('projects.deleted_at', null)

  // Extract unique projects
  const projectMap = new Map()
  if (userTasks) {
    userTasks.forEach((task: any) => {
      if (task.projects) {
        projectMap.set(task.projects.id, task.projects)
      }
    })
  }
  const assignedProjects = Array.from(projectMap.values()).sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">New Expense</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Submit a new reimbursement request with receipt.</p>
      </div>

      <EmployeeExpenseForm projects={assignedProjects || []} />
    </div>
  )
}
