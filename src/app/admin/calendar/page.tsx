import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, subMonths, addMonths } from 'date-fns'
import { ProductionCalendar } from './production-calendar'

export default async function CalendarPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/employee/dashboard')

    const now = new Date()
    const rangeStart = format(startOfWeek(startOfMonth(subMonths(now, 1))), 'yyyy-MM-dd')
    const rangeEnd = format(endOfWeek(endOfMonth(addMonths(now, 2))), 'yyyy-MM-dd')

    // Fetch tasks: use two queries merged to avoid PostgREST or() reliability issues
    // Tasks where deadline OR start_date falls in the visible date range
    const rangeStartDate = new Date(rangeStart)
    const rangeEndDate = new Date(rangeEnd)

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
            profiles:tasks_assigned_to_fkey(full_name),
            projects(title, id, status, clients(company_name))
        `)
        .is('deleted_at', null)
        .not('deadline', 'is', null)
        .gte('deadline', rangeStart)
        .lte('deadline', `${rangeEnd}T23:59:59Z`)
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
            profiles:tasks_assigned_to_fkey(full_name),
            projects(title, id, status, clients(company_name))
        `)
        .is('deleted_at', null)
        .not('start_date', 'is', null)
        .gte('start_date', rangeStart)
        .lte('start_date', rangeEnd)

    // Query 3: Tasks spanning the full range (start_date before range, deadline after range)
    const { data: tasksSpanning } = await supabase
        .from('tasks')
        .select(`
            id,
            title,
            phase,
            start_date,
            deadline,
            status,
            assigned_to,
            profiles:tasks_assigned_to_fkey(full_name),
            projects(title, id, status, clients(company_name))
        `)
        .is('deleted_at', null)
        .not('start_date', 'is', null)
        .lt('start_date', rangeStart)
        .not('deadline', 'is', null)
        .gt('deadline', `${rangeEnd}T23:59:59Z`)

    // Merge & deduplicate by id
    const mergedMap = new Map<string, any>()
    for (const t of [...(tasksByDeadline || []), ...(tasksByStartDate || []), ...(tasksSpanning || [])]) {
        if (!mergedMap.has(t.id)) mergedMap.set(t.id, t)
    }
    const rawTasks = Array.from(mergedMap.values())
        .sort((a, b) => {
            if (a.assigned_to < b.assigned_to) return -1
            if (a.assigned_to > b.assigned_to) return 1
            return 0
        })

    const { data: rawLeaves } = await supabase
        .from('leave_requests')
        .select(`
            id,
            user_id,
            start_date,
            end_date,
            leave_types(name),
            profiles:leave_requests_user_id_fkey(full_name)
        `)
        .eq('status', 'approved')
        .gte('end_date', rangeStart)
        .lte('start_date', rangeEnd)

    const { data: holidays } = await supabase
        .from('holidays')
        .select('*')
        .gte('date', rangeStart)
        .lte('date', rangeEnd)
        .order('date')

    // Fetch client meetings
    const { data: rawMeetings } = await supabase
        .from('client_meetings')
        .select(`
            id,
            title,
            meeting_date,
            duration_minutes,
            location,
            status,
            clients(company_name)
        `)
        .gte('meeting_date', rangeStart)
        .lte('meeting_date', rangeEnd)
        .order('meeting_date', { ascending: true })

    // Fetch all employees for the filter dropdown (show all employees, not just those with tasks)
    const { data: allEmployees } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'employee')
        .is('deleted_at', null)
        .order('full_name')

    // Fetch all active projects for the filter dropdown and calendar display
    const { data: allProjects } = await supabase
        .from('projects')
        .select('id, title, start_date, end_date, clients!inner(company_name)')
        .is('deleted_at', null)
        .neq('status', 'completed')
        .order('title')

    // Fetch all clients for the filter dropdown
    const { data: allClients } = await supabase
        .from('clients')
        .select('id, company_name')
        .is('deleted_at', null)
        .order('company_name')

    // === CEO/Admin Dashboard Data ===
    // Overdue tasks (deadline before today, not completed, not deleted)
    const todayStr = format(now, 'yyyy-MM-dd')
    const { data: overdueTasks } = await supabase
        .from('tasks')
        .select('id, title, deadline, assigned_to, status, phase, profiles:tasks_assigned_to_fkey(full_name), projects!inner(title, clients!inner(company_name))')
        .is('deleted_at', null)
        .lt('deadline', `${todayStr}T23:59:59Z`)
        .neq('status', 'completed')
        .order('deadline', { ascending: true })

    // Project budget utilization for active projects
    const { data: projectBudgets } = await supabase
        .from('project_budgets')
        .select('project_id, budget_amount, contingency_percent, projects!inner(title, status, clients!inner(company_name))')

    // Expense totals per project (for budget burn rate)
    const { data: expenseTotals } = await supabase
        .from('expenses')
        .select('project_id, amount')
        .in('status', ['approved', 'reimbursed'])
        .is('deleted_at', null)

    // Employee task counts (for workload overview)
    const { data: taskCountsByEmployee } = await supabase
        .from('tasks')
        .select('assigned_to, status')
        .is('deleted_at', null)
        .not('assigned_to', 'is', null)

    // Build workload stats
    const workloadByEmployee = new Map<string, { total: number; pending: number; in_progress: number; completed: number }>()
    for (const t of taskCountsByEmployee || []) {
        if (!t.assigned_to) continue
        const w = workloadByEmployee.get(t.assigned_to) || { total: 0, pending: 0, in_progress: 0, completed: 0 }
        w.total++
        if (t.status === 'pending') w.pending++
        else if (t.status === 'in_progress') w.in_progress++
        else if (t.status === 'completed') w.completed++
        workloadByEmployee.set(t.assigned_to, w)
    }

    // Build expense totals per project
    const expenseByProject = new Map<string, number>()
    for (const e of expenseTotals || []) {
        const current = expenseByProject.get(e.project_id) || 0
        expenseByProject.set(e.project_id, current + Number(e.amount))
    }

    // Normalize Supabase join responses (arrays → single objects)
    const tasks = (rawTasks || []).map((t: any) => ({
        ...t,
        profiles: Array.isArray(t.profiles) ? t.profiles[0] : t.profiles,
        projects: t.projects ? {
            ...t.projects,
            clients: Array.isArray(t.projects.clients) ? t.projects.clients[0] : t.projects.clients,
        } : t.projects,
    }))

    const leaves = (rawLeaves || []).map((l: any) => ({
        ...l,
        profiles: Array.isArray(l.profiles) ? l.profiles[0] : l.profiles,
        leave_types: Array.isArray(l.leave_types) ? l.leave_types[0] : l.leave_types,
    }))

    const meetings = (rawMeetings || []).map((m: any) => ({
        ...m,
        clients: Array.isArray(m.clients) ? m.clients[0] : m.clients,
    }))

    // Map projects to include client name and dates
    const projectsWithClient = (allProjects || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        start_date: p.start_date || null,
        end_date: p.end_date || null,
        client_name: Array.isArray(p.clients) ? p.clients[0]?.company_name : p.clients?.company_name || null,
    }))

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Production Calendar</h1>
                    <p className="text-sm text-zinc-500">Timeline view of tasks, leave, client meetings, and holidays across projects.</p>
                </div>
            </div>

            <ProductionCalendar
                initialTasks={tasks}
                initialLeaves={leaves}
                initialHolidays={holidays || []}
                initialMeetings={meetings}
                allEmployees={allEmployees || []}
                allProjects={projectsWithClient}
                allClients={allClients || []}
                overdueTasks={(overdueTasks || []).map((t: any) => ({
                    ...t,
                    profiles: Array.isArray(t.profiles) ? t.profiles[0] : t.profiles,
                    projects: Array.isArray(t.projects) ? t.projects[0] : t.projects,
                }))}
                projectBudgets={(projectBudgets || []).map((b: any) => ({
                    ...b,
                    projects: Array.isArray(b.projects) ? b.projects[0] : b.projects,
                }))}
                expenseByProject={Object.fromEntries(expenseByProject)}
                workloadByEmployee={Object.fromEntries(
                    [...workloadByEmployee.entries()].map(([id, w]) => [
                        id,
                        { ...w, employee_name: allEmployees?.find(e => e.id === id)?.full_name || 'Unknown' },
                    ])
                )}
            />
        </div>
    )
}
