/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { verifyAdminOrFounder } from '@/lib/auth-utils'
import { createNotification } from '@/lib/notifications'

const MoveKanbanCardSchema = z.object({
    taskId: z.string().uuid(),
    newStatus: z.enum(['pending', 'in_progress', 'completed', 'blocked']),
    updatedAt: z.string().datetime().optional(),
})

export async function moveKanbanCard(
    taskId: string,
    newStatus: 'pending' | 'in_progress' | 'completed' | 'blocked',
    updatedAt?: string
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        const parsed = MoveKanbanCardSchema.safeParse({ taskId, newStatus, updatedAt })
        if (!parsed.success) return { error: 'Validation failed' }

        // Optimistic locking — check if task was modified since we last fetched
        if (parsed.data.updatedAt) {
            const { data: current } = await supabase
                .from('tasks')
                .select('updated_at, assigned_to, title, status')
                .eq('id', taskId)
                .single()

            if (!current) return { error: 'Task not found' }

            const serverTime = new Date(current.updated_at).getTime()
            const clientTime = new Date(parsed.data.updatedAt).getTime()

            if (serverTime > clientTime) {
                // Conflict — return current state for reconciliation
                return {
                    error: 'conflict',
                    serverState: {
                        status: current.status,
                        updated_at: current.updated_at,
                    },
                }
            }

            // If task is being completed, set completed_at
            const extraUpdate: Record<string, any> = { status: newStatus }
            if (newStatus === 'completed') {
                extraUpdate.completed_at = new Date().toISOString()
            }

            const { error } = await supabase
                .from('tasks')
                .update(extraUpdate)
                .eq('id', taskId)

            if (error) return { error: error.message }

            // Notify assignee if status changed to blocked
            if (newStatus === 'blocked' && current.assigned_to) {
                await createNotification(
                    current.assigned_to,
                    'task_blocked',
                    `Task Blocked: ${current.title}`,
                    'A task assigned to you has been marked as blocked.',
                    `/admin/kanban`,
                    false,
                )
            }
        } else {
            // No optimistic locking — simple update
            const extraUpdate: Record<string, any> = { status: newStatus }
            if (newStatus === 'completed') {
                extraUpdate.completed_at = new Date().toISOString()
            }

            const { data: task, error } = await supabase
                .from('tasks')
                .update(extraUpdate)
                .eq('id', taskId)
                .select('assigned_to, title')
                .single()

            if (error) return { error: error.message }

            if (newStatus === 'blocked' && task?.assigned_to) {
                await createNotification(
                    task.assigned_to,
                    'task_blocked',
                    `Task Blocked: ${task.title}`,
                    'A task assigned to you has been marked as blocked.',
                    `/admin/kanban`,
                    false,
                )
            }
        }

        revalidatePath('/admin/kanban')
        return { success: true }
    } catch (err: unknown) {
        console.error('moveKanbanCard error:', err)
        return { error: (err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred' }
    }
}

export async function getKanbanTasks(): Promise<KanbanTaskResponse[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return []

    const { data: tasks } = await supabase
        .from('tasks')
        .select(`
            id,
            title,
            status,
            phase,
            deadline,
            assigned_to,
            updated_at,
            profiles!tasks_assigned_to_fkey ( full_name ),
            projects ( id, title )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100)

    if (!tasks) return []

    return tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        project_name: t.projects?.title || 'No Project',
        project_id: t.projects?.id || '',
        assigned_to: t.assigned_to,
        assigned_name: t.profiles?.full_name || null,
        phase: t.phase || '',
        deadline: t.deadline,
        status: (['pending', 'in_progress', 'completed', 'blocked'].includes(t.status) ? t.status : 'pending') as 'pending' | 'in_progress' | 'completed' | 'blocked',
        dragId: `task-${t.id}`,
        updated_at: t.updated_at,
    }))
}

export interface KanbanTaskResponse {
    id: string
    title: string
    project_name: string
    project_id: string
    assigned_to: string | null
    assigned_name: string | null
    phase: string
    deadline: string | null
    status: 'pending' | 'in_progress' | 'completed' | 'blocked'
    dragId: string
    updated_at: string
}
