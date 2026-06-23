import { createClient } from '@/lib/supabase/server'
import { TaskCard } from './task-card'

export default async function EmployeeDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch assigned tasks with their subtasks and sub_subtasks
  const { data: tasks, error: tasksErr } = await supabase
    .from('tasks')
    .select(`
      *,
      projects ( title, clients ( company_name ) ),
      subtasks (*, sub_subtasks (*))
    `)
    .eq('assigned_to', user.id)
    .order('deadline', { ascending: true })

  // Fetch all subtask comments for the loaded tasks
  const subtaskIds = (tasks || []).flatMap(t => (t.subtasks || []).map((s: any) => s.id))
  
  let allComments: any[] = []
  let commentsErr: any = null

  if (subtaskIds.length > 0) {
    const { data, error } = await supabase
      .from('subtask_comments')
      .select('*, profiles(full_name, role)')
      .in('subtask_id', subtaskIds)
      .order('created_at', { ascending: true })
      
    allComments = data || []
    commentsErr = error
  }

  if (tasksErr) console.error('Employee tasks fetch error:', tasksErr.message)
  if (commentsErr) console.error('Employee comments fetch error:', commentsErr.message)

  // Group comments by subtask_id
  const commentsBySubtask = new Map<string, any[]>()
  for (const comment of allComments || []) {
    const existing = commentsBySubtask.get(comment.subtask_id) || []
    existing.push(comment)
    commentsBySubtask.set(comment.subtask_id, existing)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">My Tasks</h1>
        <p className="text-zinc-600 dark:text-zinc-400">View and update your assigned work.</p>
      </div>

      {tasks && tasks.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} commentsBySubtask={Object.fromEntries(commentsBySubtask)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-zinc-900/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="text-zinc-500 dark:text-zinc-500 font-medium">You have no assigned tasks.</div>
          <p className="text-sm text-zinc-600 mt-1">Enjoy your free time!</p>
        </div>
      )}
    </div>
  )
}
