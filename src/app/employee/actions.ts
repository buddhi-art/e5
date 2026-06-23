'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleSubtask(subtaskId: string, isCompleted: boolean) {
  const supabase = await createClient()
  
  // RLS will ensure they can only update if assigned
  const { error } = await supabase
    .from('subtasks')
    .update({ is_completed: isCompleted })
    .eq('id', subtaskId)

  if (error) {
    return { error: error.message }
  }

  // Find task ID to check overall progress
  const { data: subtask } = await supabase.from('subtasks').select('task_id').eq('id', subtaskId).single()
  if (subtask) {
    const { data: allSubs } = await supabase.from('subtasks').select('is_completed').eq('task_id', subtask.task_id)
    if (allSubs) {
      const allDone = allSubs.every(s => s.is_completed)
      const someDone = allSubs.some(s => s.is_completed)
      
      let newStatus = 'pending'
      if (allDone) newStatus = 'completed'
      else if (someDone) newStatus = 'in_progress'

      await supabase.from('tasks').update({ status: newStatus }).eq('id', subtask.task_id)
    }
  }

  revalidatePath('/employee')
  return { success: true }
}

export async function toggleSubSubtask(subSubtaskId: string, isCompleted: boolean) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('sub_subtasks')
    .update({ is_completed: isCompleted })
    .eq('id', subSubtaskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/employee')
  return { success: true }
}

export async function updateMainTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/employee')
  return { success: true }
}
