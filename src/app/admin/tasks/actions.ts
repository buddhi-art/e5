'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AssignTaskSchema, UpdateTaskSchema, UuidParamSchema } from '@/lib/validations'
import { verifyAdminOrFounder } from '@/lib/auth-utils'
import { createNotification } from '@/lib/notifications'

export async function assignTask(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = AssignTaskSchema.safeParse({
      project_id: formData.get('project_id'),
      phase: formData.get('phase'),
      assigned_to: formData.get('assigned_to'),
      title: formData.get('title'),
      description: formData.get('description'),
      start_date: formData.get('start_date'),
      deadline: formData.get('deadline'),
      subtasksRaw: formData.get('subtasks'),
    })

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const data = parsed.data

    // Get current task count to determine task number
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    const taskNumber = (count || 0) + 1
    const basePrefix = `E5_Task_${taskNumber}`
    const finalTitle = `${basePrefix} - ${data.title}`

    // Insert main task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        project_id: data.project_id,
        phase: data.phase,
        assigned_to: data.assigned_to,
        title: finalTitle,
        description: data.description,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
      })
      .select()
      .single()

    if (taskError) return { error: taskError.message }

    // Notify the assignee that a task was assigned to them.
    if (data.assigned_to && data.assigned_to !== user.id) {
      await createNotification(
        data.assigned_to,
        'task_assigned',
        `New Task Assigned: ${finalTitle}`,
        data.deadline
          ? `You have been assigned a task, due ${new Date(data.deadline).toLocaleDateString()}.`
          : 'You have been assigned a new task.',
        '/employee',
        true,
      )
    }

    // Insert subtasks
    if (data.subtasksRaw) {
      try {
        const subtasks = JSON.parse(data.subtasksRaw)
        if (subtasks.length > 0) {
          let subtaskIndex = 1
          for (const st of subtasks) {
            const subtaskPrefix = `${basePrefix}.${subtaskIndex}`
            const stTitle = st.title || st // Handle both old string format and new object format just in case

            const { data: stData, error: subError } = await supabase
              .from('subtasks')
              .insert({
                task_id: task.id,
                title: `${subtaskPrefix} - ${stTitle}`,
                is_completed: false
              })
              .select()
              .single()

            if (subError) return { error: 'Task created, but failed to create subtasks: ' + subError.message }

            if (st.subSubtasks && st.subSubtasks.length > 0) {
              let subSubtaskIndex = 1
              const sstInserts = st.subSubtasks.map((sst: string) => ({
                subtask_id: stData.id,
                title: `${subtaskPrefix}.${subSubtaskIndex++} - ${sst}`,
                is_completed: false
              }))
              const { error: sstError } = await supabase
                .from('sub_subtasks')
                .insert(sstInserts)

              if (sstError) return { error: 'Task created, but failed to create sub-subtasks: ' + sstError.message }
            }
            subtaskIndex++
          }
        }
      } catch (e) {
        console.error('Failed to parse subtasks:', e)
      }
    }

    revalidatePath('/admin/tasks')
    revalidatePath('/admin/calendar')
    return { success: true }
  } catch (err: any) {
    console.error('Error in assignTask:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function updateTask(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UpdateTaskSchema.safeParse({
      project_id: formData.get('project_id'),
      phase: formData.get('phase'),
      assigned_to: formData.get('assigned_to'),
      title: formData.get('title'),
      description: formData.get('description'),
      start_date: formData.get('start_date'),
      deadline: formData.get('deadline'),
      status: formData.get('status'),
    })

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const data = parsed.data

    // If status is being set to completed, also set completed_at
    const extraUpdate: Record<string, any> = {}
    if (data.status === 'completed') {
      extraUpdate.completed_at = new Date().toISOString()
    }

    // Capture the previous assignee so we only notify on a genuine reassignment.
    const { data: prevTask } = await supabase
      .from('tasks')
      .select('assigned_to')
      .eq('id', id)
      .single()

    const { error: taskError } = await supabase
      .from('tasks')
      .update({
        project_id: data.project_id,
        phase: data.phase,
        assigned_to: data.assigned_to,
        title: data.title,
        description: data.description,
        status: data.status,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        ...extraUpdate,
      })
      .eq('id', id)

    if (taskError) return { error: taskError.message }

    // Notify the new assignee if the task was reassigned to someone else.
    if (
      data.assigned_to &&
      data.assigned_to !== prevTask?.assigned_to &&
      data.assigned_to !== user.id
    ) {
      await createNotification(
        data.assigned_to,
        'task_assigned',
        `Task Assigned: ${data.title}`,
        data.deadline
          ? `A task has been assigned to you, due ${new Date(data.deadline).toLocaleDateString()}.`
          : 'A task has been assigned to you.',
        '/employee',
        true,
      )
    }

    revalidatePath('/admin/tasks')
    revalidatePath('/admin/calendar')
    return { success: true }
  } catch (err: any) {
    console.error('Error in updateTask:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function deleteTask(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id });
    if (!parsed.success) return { error: 'Invalid task ID' };

    // Subtasks are set to ON DELETE CASCADE in db schema
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/tasks')
    revalidatePath('/admin/calendar')
    return { success: true }
  } catch (err: any) {
    console.error('Error in deleteTask:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}
