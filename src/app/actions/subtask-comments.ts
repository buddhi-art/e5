'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSubtaskComment(subtaskId: string, content: string) {
    if (!content.trim()) {
        return { error: 'Comment cannot be empty' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, designation, deleted_at')
        .eq('id', user.id)
        .single()
    if (!profile || profile.deleted_at) return { error: 'Not authorized' }

    const { data: subtask } = await supabase
        .from('subtasks')
        .select('task_id, tasks!inner(assigned_to)')
        .eq('id', subtaskId)
        .maybeSingle()
    const task = Array.isArray(subtask?.tasks) ? subtask.tasks[0] : subtask?.tasks
    const canComment = profile.role === 'admin' || profile.designation === 'Founder' || task?.assigned_to === user.id
    if (!canComment) return { error: 'You are not assigned to this task' }

    const { data: comment, error } = await supabase
        .from('subtask_comments')
        .insert({
            subtask_id: subtaskId,
            author_id: user.id,
            content: content.trim(),
        })
        .select('*, profiles(full_name, role)')
        .single()

    if (error) return { error: error.message }

    revalidatePath('/admin/tasks')
    revalidatePath('/employee')
    return { success: true, comment }
}

