'use server'

import { createClient } from '@/lib/supabase/server'

export interface NotificationItem {
    id: string
    type: 'leave_request' | 'overdue_task' | 'overdue_invoice' | 'pending_payment'
    title: string
    description: string
    href: string
    createdAt: string
}

export async function getNotifications(): Promise<NotificationItem[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'
    const notifications: NotificationItem[] = []

    if (isAdmin) {
        // Pending leave requests
        const { data: pendingLeaves } = await supabase
            .from('leave_requests')
            .select('id, created_at, profiles!leave_requests_user_id_fkey(full_name), leave_types(name)')
            .eq('status', 'pending')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(5)

        for (const leave of pendingLeaves || []) {
            const name = Array.isArray(leave.profiles)
                ? leave.profiles[0]?.full_name
                : (leave.profiles as any)?.full_name
            const leaveType = Array.isArray(leave.leave_types)
                ? leave.leave_types[0]?.name
                : (leave.leave_types as any)?.name
            notifications.push({
                id: `leave-${leave.id}`,
                type: 'leave_request',
                title: `Leave request from ${name || 'Unknown'}`,
                description: `${leaveType || 'Leave'} request pending approval`,
                href: '/admin/leave/requests',
                createdAt: leave.created_at,
            })
        }

        // Overdue tasks (non-completed, deadline past)
        const todayStr = new Date().toISOString().split('T')[0]
        const { data: overdueTasks } = await supabase
            .from('tasks')
            .select('id, title, deadline, profiles!tasks_assigned_to_fkey(full_name)')
            .is('deleted_at', null)
            .lt('deadline', `${todayStr}T23:59:59Z`)
            .neq('status', 'completed')
            .order('deadline', { ascending: true })
            .limit(5)

        for (const task of overdueTasks || []) {
            const name = Array.isArray(task.profiles)
                ? task.profiles[0]?.full_name
                : (task.profiles as any)?.full_name
            notifications.push({
                id: `task-${task.id}`,
                type: 'overdue_task',
                title: `Overdue: ${task.title}`,
                description: `Assigned to ${name || 'Unassigned'}`,
                href: '/admin/tasks',
                createdAt: task.deadline || '',
            })
        }

        // Overdue invoices
        const { data: overdueInvoices } = await supabase
            .from('invoices')
            .select('id, invoice_number, due_date, clients(company_name)')
            .in('status', ['sent', 'partially_paid', 'draft'])
            .lt('due_date', todayStr)
            .is('deleted_at', null)
            .order('due_date', { ascending: true })
            .limit(5)

        for (const inv of overdueInvoices || []) {
            const companyName = Array.isArray(inv.clients)
                ? inv.clients[0]?.company_name
                : (inv.clients as any)?.company_name
            notifications.push({
                id: `inv-${inv.id}`,
                type: 'overdue_invoice',
                title: `Overdue invoice: ${inv.invoice_number}`,
                description: `${companyName || 'Unknown client'} - due ${new Date(inv.due_date).toLocaleDateString()}`,
                href: `/admin/invoices/${inv.id}`,
                createdAt: inv.due_date,
            })
        }
    } else {
        // Employee: upcoming deadlines, leave status changes
        const todayStr = new Date().toISOString().split('T')[0]
        const { data: myTasks } = await supabase
            .from('tasks')
            .select('id, title, deadline')
            .eq('assigned_to', user.id)
            .is('deleted_at', null)
            .neq('status', 'completed')
            .order('deadline', { ascending: true })
            .limit(5)

        for (const task of myTasks || []) {
            const isOverdue = task.deadline && task.deadline < todayStr
            notifications.push({
                id: `etask-${task.id}`,
                type: 'overdue_task',
                title: isOverdue ? `Overdue: ${task.title}` : `Upcoming: ${task.title}`,
                description: isOverdue
                    ? `Deadline was ${new Date(task.deadline).toLocaleDateString()}`
                    : `Due ${new Date(task.deadline).toLocaleDateString()}`,
                href: '/employee',
                createdAt: task.deadline || '',
            })
        }

        // Leave status updates
        const { data: myLeaves } = await supabase
            .from('leave_requests')
            .select('id, status, start_date, leave_types(name)')
            .eq('user_id', user.id)
            .neq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(3)

        for (const leave of myLeaves || []) {
            const leaveType = Array.isArray(leave.leave_types)
                ? leave.leave_types[0]?.name
                : (leave.leave_types as any)?.name
            notifications.push({
                id: `eleave-${leave.id}`,
                type: 'leave_request',
                title: `Leave ${leave.status}`,
                description: `${leaveType || 'Leave'} from ${new Date(leave.start_date).toLocaleDateString()} was ${leave.status}`,
                href: '/employee/leave',
                createdAt: new Date().toISOString(),
            })
        }
    }

    // Sort: newest first
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return notifications
}
