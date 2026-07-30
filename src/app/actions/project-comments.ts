'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications'

export interface ProjectComment {
  id: string
  project_id: string
  user_id: string
  comment_text: string
  created_at: string
  profiles?: {
    full_name: string
    role: string
    designation: string
  }
}

export async function getProjectComments(projectId: string): Promise<ProjectComment[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from('project_comments')
      .select('*, profiles(full_name, role, designation)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    return data || []
  } catch (err) {
    console.error('Error fetching project comments:', err)
    return []
  }
}

export async function getProjectTeamMembers(): Promise<{ id: string; full_name: string; role: string; designation?: string }[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('id, full_name, role, designation').is('deleted_at', null)
    return data || []
  } catch {
    return []
  }
}

export async function addProjectComment(projectId: string, text: string) {
  try {
    if (!text.trim()) return { error: 'Comment cannot be empty' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('project_comments')
      .insert({
        project_id: projectId,
        user_id: user.id,
        comment_text: text.trim()
      })

    if (error) return { error: error.message }

    // Detect @mentions and send notifications
    const allProfiles = await getProjectTeamMembers()
    const sender = allProfiles.find(p => p.id === user.id)
    const senderName = sender?.full_name || 'A team member'

    const mentionedUsers = allProfiles.filter(p =>
      text.toLowerCase().includes(`@${p.full_name.toLowerCase()}`) && p.id !== user.id
    )

    if (mentionedUsers.length > 0) {
      await Promise.all(mentionedUsers.map(m => createNotification(
        m.id,
        'system',
        'New Mention',
        `${senderName} mentioned you in a project discussion: "${text.trim().substring(0, 60)}..."`,
        m.designation === 'Founder'
          ? '/founder/projects'
          : m.role === 'admin'
            ? `/admin/projects/${projectId}`
            : '/employee',
      )))
    }

    revalidatePath(`/admin/projects/${projectId}`)
    revalidatePath(`/admin/packages/[id]`, 'page')
    revalidatePath(`/founder/review-queue`)
    revalidatePath(`/employee`)
    revalidatePath(`/founder/projects`)

    return { success: true }
  } catch (err: unknown) {
    return { error: (err instanceof Error ? err.message : String(err)) }
  }
}
