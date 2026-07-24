/* eslint-disable @typescript-eslint/no-explicit-any */
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

      if (newStatus === 'completed') {
        await triggerTaskCompletionNotifications(supabase, subtask.task_id)
      }
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

async function triggerTaskCompletionNotifications(supabase: any, taskId: string) {
  try {
    const { data: completedTask } = await supabase
      .from('tasks')
      .select('title, phase, project_id, projects(title)')
      .eq('id', taskId)
      .single()

    if (!completedTask) return

    const projectTitle = (completedTask as any).projects?.title || 'Project'

    // 1. Notify Admins and Founders
    const { data: admins } = await supabase.from('profiles').select('id').in('role', ['admin', 'founder'])
    const adminNotifs = (admins || []).map((admin: any) => ({
      user_id: admin.id,
      title: 'Task Completed',
      message: `Task "${completedTask.title}" has been completed for ${projectTitle}.`,
      link_url: `/admin/projects/${completedTask.project_id}`,
      is_read: false
    }))
    if (adminNotifs.length > 0) {
      await supabase.from('notifications').insert(adminNotifs)
    }

    // 2. Baton Pass: If Videography phase completed, check for assigned Editor in Phase 3
    const isVideography = completedTask.phase?.includes('Phase 2') || completedTask.title?.toLowerCase().includes('videography') || completedTask.title?.toLowerCase().includes('shoot')
    if (isVideography) {
      const { data: editingTasks } = await supabase
        .from('tasks')
        .select('id, assigned_to, title')
        .eq('project_id', completedTask.project_id)
        .or('phase.ilike.%Phase 3%,title.ilike.%editing%')
        .not('assigned_to', 'is', null)

      for (const editTask of editingTasks || []) {
        if (editTask.assigned_to) {
          await supabase.from('notifications').insert({
            user_id: editTask.assigned_to,
            title: 'Footage Ready! (Baton Pass)',
            message: `Footage is ready, Editing phase has begun for ${projectTitle}.`,
            link_url: `/employee`,
            is_read: false
          })
        }
      }
    }
  } catch (err) {
    console.error('Error triggering completion notifications:', err)
  }
}

export async function updateMainTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = TaskStatusUpdateSchema.safeParse({ taskId, status });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  // Defense-in-depth: check if user is assigned to task
  const { data: task } = await supabase
    .from('tasks')
    .select('assigned_to')
    .eq('id', data.taskId)
    .maybeSingle()

  if (!task || task.assigned_to !== user.id) {
    return { error: 'Unauthorized' }
  }

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

  if (data.status === 'completed') {
    await triggerTaskCompletionNotifications(supabase, data.taskId)
  }

  revalidatePath('/employee')
  return { success: true }
}
