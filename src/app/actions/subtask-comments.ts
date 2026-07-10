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

export async function getSubtaskComments(subtaskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated', comments: [] }

    const { data, error } = await supabase
        .from('subtask_comments')
        .select(`
      *,
      profiles ( full_name, role )
    `)
        .eq('subtask_id', subtaskId)
        .order('created_at', { ascending: true })

    if (error) return { error: error.message, comments: [] }

    return { comments: data || [], error: null }
}
