/* eslint-disable @typescript-eslint/no-explicit-any */
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
    <div className="space-y-8">
      <div className="morph-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">My Tasks</h1>
        <p className="text-base text-on-surface-variant mt-2">View and update your assigned work.</p>
      </div>

      {tasks && tasks.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {tasks.map((task, i) => (
            <div key={task.id} className="morph-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <TaskCard task={task} commentsBySubtask={Object.fromEntries(commentsBySubtask)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl bg-surface-container-lowest elevation-1 ring-1 ring-outline-variant/40 card-morph morph-fade-in">
          <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-foreground">No assigned tasks</p>
          <p className="text-sm text-on-surface-variant mt-1">Enjoy your free time!</p>
        </div>
      )}
    </div>
  )
}
