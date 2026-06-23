'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignTask(formData: FormData) {
  try {
    const supabase = await createClient()

    const project_id = formData.get('project_id') as string
    const phase = formData.get('phase') as string
    const assigned_to = formData.get('assigned_to') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const start_date = formData.get('start_date') as string
    const deadline = formData.get('deadline') as string
    const subtasksRaw = formData.get('subtasks') as string

    if (!project_id || !phase || !assigned_to || !title) {
      return { error: 'Project, Phase, Employee, and Title are required.' }
    }

    // Get current task count to determine task number
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    const taskNumber = (count || 0) + 1
    const basePrefix = `E5_Task_${taskNumber}`
    const finalTitle = `${basePrefix} - ${title}`

    // Insert main task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        project_id,
        phase,
        assigned_to,
        title: finalTitle,
        description,
        start_date: start_date ? new Date(start_date).toISOString() : null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      })
      .select()
      .single()

    if (taskError) return { error: taskError.message }

    // Insert subtasks
    if (subtasksRaw) {
      try {
        const subtasks = JSON.parse(subtasksRaw)
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

    const project_id = formData.get('project_id') as string
    const phase = formData.get('phase') as string
    const assigned_to = formData.get('assigned_to') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const start_date = formData.get('start_date') as string
    const deadline = formData.get('deadline') as string
    const status = formData.get('status') as string

    if (!project_id || !phase || !assigned_to || !title) {
      return { error: 'Project, Phase, Employee, and Title are required.' }
    }

    const { error: taskError } = await supabase
      .from('tasks')
      .update({
        project_id,
        phase,
        assigned_to,
        title,
        description,
        status,
        start_date: start_date ? new Date(start_date).toISOString() : null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      })
      .eq('id', id)

    if (taskError) return { error: taskError.message }

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
