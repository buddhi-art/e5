'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TaskStatusUpdateSchema, SubtaskToggleSchema } from '@/lib/validations'

export async function toggleSubtask(subtaskId: string, isCompleted: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = SubtaskToggleSchema.safeParse({ subtaskId, isCompleted });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  // Defense-in-depth: verify the subtask's parent task is assigned to this
  // user before mutating, in addition to the RLS policy.
  const { data: ownedSubtask } = await supabase
    .from('subtasks')
    .select('id, tasks!inner(assigned_to)')
    .eq('id', data.subtaskId)
    .eq('tasks.assigned_to', user.id)
    .maybeSingle()

  if (!ownedSubtask) return { error: 'Unauthorized' }

  // RLS will ensure they can only update if assigned
  const { error } = await supabase
    .from('subtasks')
    .update({ is_completed: data.isCompleted })
    .eq('id', data.subtaskId)

  if (error) {
    return { error: error.message }
  }

  // Find task ID to check overall progress
  const { data: subtask } = await supabase.from('subtasks').select('task_id').eq('id', data.subtaskId).single()
  if (subtask) {
    const { data: allSubs } = await supabase.from('subtasks').select('is_completed').eq('task_id', subtask.task_id)
    if (allSubs) {
      const allDone = allSubs.every(s => s.is_completed)
      const someDone = allSubs.some(s => s.is_completed)

      let newStatus = 'pending'
      if (allDone) newStatus = 'completed'
      else if (someDone) newStatus = 'in_progress'

      const taskUpdate: Record<string, any> = { status: newStatus }
      if (newStatus === 'completed') {
        taskUpdate.completed_at = new Date().toISOString()
      }
      await supabase.from('tasks').update(taskUpdate).eq('id', subtask.task_id)
    }
  }

  revalidatePath('/employee')
  return { success: true }
}

export async function toggleSubSubtask(subSubtaskId: string, isCompleted: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = SubtaskToggleSchema.safeParse({ subtaskId: subSubtaskId, isCompleted });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  // Defense-in-depth: verify the sub-subtask chains up to a task assigned to
  // this user (sub_subtask → subtask → task.assigned_to), in addition to RLS.
  const { data: ownedSubSubtask } = await supabase
    .from('sub_subtasks')
    .select('id, subtasks!inner(tasks!inner(assigned_to))')
    .eq('id', data.subtaskId)
    .eq('subtasks.tasks.assigned_to', user.id)
    .maybeSingle()

  if (!ownedSubSubtask) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('sub_subtasks')
    .update({ is_completed: data.isCompleted })
    .eq('id', data.subtaskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/employee')
  return { success: true }
}

export async function updateMainTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = TaskStatusUpdateSchema.safeParse({ taskId, status });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const taskUpdate: Record<string, any> = { status: data.status }
  if (data.status === 'completed') {
    taskUpdate.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('tasks')
    .update(taskUpdate)
    .eq('id', data.taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/employee')
  return { success: true }
}
