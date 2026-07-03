'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { QuickUpdateTaskDateSchema } from '@/lib/validations'
import { verifyAdminOrFounder } from '@/lib/auth-utils'

export async function getCalendarData(startDate: string, endDate: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    // Query 1: Tasks with deadline in range
    const { data: tasksByDeadline } = await supabase
        .from('tasks')
        .select(`
            id,
            title,
            phase,
            start_date,
            deadline,
            status,
            assigned_to,
            profiles:assigned_to(full_name),
            projects(title, id, status, clients(company_name))
        `)
        .not('deadline', 'is', null)
        .is('deleted_at', null)
        .gte('deadline', startDate)
        .lte('deadline', `${endDate}T23:59:59Z`)
        .order('assigned_to')
        .order('start_date', { ascending: true })

    // Query 2: Tasks with start_date in range (but NOT already fetched by deadline query)
    const { data: tasksByStartDate } = await supabase
        .from('tasks')
        .select(`
            id,
            title,
            phase,
            start_date,
            deadline,
            status,
            assigned_to,
            profiles:assigned_to(full_name),
            projects(title, id, status, clients(company_name))
        `)
        .not('start_date', 'is', null)
        .is('deleted_at', null)
        .gte('start_date', startDate)
        .lte('start_date', endDate)

    // Merge & deduplicate
    const mergedMap = new Map<string, any>()
    for (const t of [...(tasksByDeadline || []), ...(tasksByStartDate || [])]) {
        if (!mergedMap.has(t.id)) mergedMap.set(t.id, t)
    }
    const tasks = Array.from(mergedMap.values())

    const { data: leaves } = await supabase
        .from('leave_requests')
        .select(`
      id,
      user_id,
      start_date,
      end_date,
      total_days,
      leave_types(name),
      profiles:user_id(full_name)
    `)
        .eq('status', 'approved')
        .gte('end_date', startDate)
        .lte('start_date', endDate)

    const { data: holidays } = await supabase
        .from('holidays')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')

    return { tasks: tasks || [], leaves: leaves || [], holidays: holidays || [] }
}

export async function quickUpdateTaskDate(taskId: string, startDate: string | null, deadline: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = QuickUpdateTaskDateSchema.safeParse({ taskId, startDate, deadline })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { error } = await supabase
        .from('tasks')
        .update({
            start_date: parsed.data.startDate || null,
            deadline: parsed.data.deadline,
            updated_at: new Date().toISOString()
        })
        .eq('id', parsed.data.taskId)

    if (error) return { error: error.message }

    revalidatePath('/admin/calendar')
    return { success: true }
}
