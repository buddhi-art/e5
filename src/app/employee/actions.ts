'use server'

/* ── Local row types for Supabase results ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = Record<string, any>

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TaskStatusUpdateSchema, SubtaskToggleSchema, TaskLogisticsSchema, UpdateTaskPhaseWorkspaceSchema } from '@/lib/validations'
import { isHandoffReady, isWorkspacePhase, mergeWorkspacePatch, PHASE_HANDOFFS } from '@/lib/phase-workspace'
import { createNotification } from '@/lib/notifications'

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

      const taskUpdate: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'completed') {
        taskUpdate['completed_at'] = new Date().toISOString()
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function triggerTaskCompletionNotifications(supabase: any, taskId: string) {
  try {
    const { data: completedTask } = await supabase
      .from('tasks')
      .select('title, phase, project_id, logistics, projects(title)')
      .eq('id', taskId)
      .single()

    if (!completedTask) return

    const projectTitle = (completedTask as SupabaseRow).projects?.title || 'Project'

    // 1. Notify admins and founders. Founders are identified by designation,
    // not a separate role value (the role enum only includes admin/employee).
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .or('role.eq.admin,designation.eq.Founder')
    const isDelivery = completedTask.phase === 'Phase 5'
    const adminNotificationTitle = isDelivery ? 'Project Delivered' : 'Task Completed'
    const adminNotificationDescription = isDelivery
      ? `Project delivery task "${completedTask.title}" has been completed for ${projectTitle}.`
      : `Task "${completedTask.title}" has been completed for ${projectTitle}.`
    await Promise.all(
      (admins || []).map((admin: SupabaseRow) =>
        createNotification(
          admin.id,
          'system',
          adminNotificationTitle,
          adminNotificationDescription,
          `/admin/projects/${completedTask.project_id}`,
        ),
      ),
    )

    // 2. Table-driven baton pass for every production transition.
    const handoff = PHASE_HANDOFFS[completedTask.phase]
    if (handoff && isHandoffReady(completedTask.phase, completedTask.logistics)) {
      const { data: nextTasks } = await supabase
        .from('tasks')
        .select('id, assigned_to, title')
        .eq('project_id', completedTask.project_id)
        .eq('phase', handoff.nextPhase)
        .not('assigned_to', 'is', null)

      const recipientIds = [...new Set<string>(
        (nextTasks || [])
          .map((task: SupabaseRow) => task.assigned_to)
          .filter((userId: unknown): userId is string => typeof userId === 'string'),
      )]
      await Promise.all(
        recipientIds.map((userId) =>
          createNotification(
            userId,
            'system',
            handoff.title,
            `${handoff.message} for ${projectTitle}.`,
            '/employee',
          ),
        ),
      )
    }
  } catch (err) {
    console.error('Error triggering completion notifications:', err)
  }
}

export async function updateTaskPhaseWorkspace(taskId: string, patch: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = UpdateTaskPhaseWorkspaceSchema.safeParse({ taskId, patch })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: task } = await supabase
    .from('tasks')
    .select('assigned_to, phase, logistics')
    .eq('id', parsed.data.taskId)
    .maybeSingle()

  if (!task || task.assigned_to !== user.id) return { error: 'Unauthorized' }
  if (!isWorkspacePhase(task.phase)) return { error: 'This task does not have an employee phase workspace' }

  const patchData = parsed.data.patch
  const primaryLinkField = task.phase === 'Phase 1'
    ? 'scriptLink'
    : task.phase === 'Phase 4'
      ? 'reviewLink'
      : 'finalDeliveryLink'

  const invalidPatchKey = Object.keys(patchData).find((key) => {
    if (key === 'checklist') return false
    if (key === primaryLinkField) return false
    return task.phase !== 'Phase 4' || !['qaVerdict', 'qaNotes', 'blockingIssues'].includes(key)
  })
  if (invalidPatchKey) return { error: `This field cannot be updated for ${task.phase}` }

  const existing = TaskLogisticsSchema.safeParse(task.logistics ?? {})
  const merged = mergeWorkspacePatch(existing.success ? existing.data : {}, patchData)
  const validated = TaskLogisticsSchema.safeParse(merged)
  if (!validated.success) return { error: validated.error.issues[0].message }

  const { error } = await supabase
    .from('tasks')
    .update({ logistics: validated.data })
    .eq('id', parsed.data.taskId)
    .eq('assigned_to', user.id)

  if (error) return { error: error.message }

  revalidatePath('/employee')
  return { success: true, logistics: validated.data }
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

  const taskUpdate: Record<string, unknown> = { status: data.status }
  if (data.status === 'completed') {
    taskUpdate['completed_at'] = new Date().toISOString()
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
