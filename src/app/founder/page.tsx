/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import globalCache from '@/lib/cache'
import { FounderDashboardClient } from './founder-dashboard-client'

export const revalidate = 300

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

interface FounderDashboardData {
    totalEmployees: number
    checkedInToday: number
    onLeaveToday: number
    absentToday: number
    lateToday: number
    attendanceRate: number
    activeProjects: number
    completedProjects: number
    projectHealthPercent: number
    pendingTasks: number
    inProgressTasks: number
    completedTasks: number
    overdueTasks: number
    onTimeCompletion: number
    totalReceivable: number
    revenueThisMonth: number
    revenueLastMonth: number
    totalExpenses: number
    budgetUtilization: number
    draftInvoices: number
    activeInvoices: number
    overdueInvoices: number
    paidInvoices: number
    equipmentAvailable: number
    equipmentCheckedOut: number
    equipmentInMaintenance: number
    clientCount: number
    totalMeetings: number
    month: string
    recentTasks: any[]
    todayAttendance: any[]
    expenseByCategory: { category: string; total: number }[]
    monthlyRevenueData: { month: string; revenue: number }[]
    topClients: { company_name: string; revenue: number }[]
    completedTasksThisMonth: number
    tasksThisMonth: number
    monthlyInvoicesPaid: number
    monthlyInvoicesTotal: number
}

async function fetchFounderDashboard(): Promise<FounderDashboardData> {
    const supabase = await createClient()

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    const monthStr = `${MONTHS[currentMonth]} ${currentYear}`
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
    const startOfYear = new Date(currentYear, 0, 1).toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const cacheKey = `founder_dashboard_${monthStr}_${todayStr}`
    const cached = await globalCache.get(cacheKey) as FounderDashboardData | null
    if (cached) return cached

    // ── Parallel queries ──
    const [
        { count: totalEmployees } = { count: 0 },
        { data: todayAttendance } = { data: [] },
        { data: last30DaysAttendance } = { data: [] },
        { data: leaveRequestsToday } = { data: [] },
        { data: allProjects } = { data: [] },
        { count: pendingTasks } = { count: 0 },
        { count: inProgressTasks } = { count: 0 },
        { count: completedTasks } = { count: 0 },
        { data: overdueTasksData } = { data: [] },
        recentTasksResult,
        { data: invoices } = { data: [] },
        { data: thisMonthInvoices } = { data: [] },
        { data: lastMonthInvoices } = { data: [] },
        { data: expenses } = { data: [] },
        { data: expensesWithCategory } = { data: [] },
        { data: projectBudgets } = { data: [] },
        { count: equipmentAvailable } = { count: 0 },
        { count: equipmentCheckedOut } = { count: 0 },
        { count: equipmentInMaintenance } = { count: 0 },
        { count: clientCount } = { count: 0 },
        { data: monthlyInvoices } = { data: [] },
        { data: invoicesByClient } = { data: [] },
        { count: completedTasksThisMonth } = { count: 0 },
        { count: tasksThisMonth } = { count: 0 },
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true })
            .eq('role', 'employee').is('deleted_at', null),
        supabase.from('attendance')
            .select('*, profiles(full_name)')
            .eq('date', todayStr)
            .order('created_at', { ascending: false }),
        supabase.from('attendance')
            .select('status, date')
            .gte('date', thirtyDaysAgo)
            .lte('date', todayStr),
        supabase.from('leave_requests')
            .select('*')
            .eq('status', 'approved')
            .is('deleted_at', null)
            .lte('start_date', todayStr)
            .gte('end_date', todayStr),
        supabase.from('projects')
            .select('status')
            .is('deleted_at', null),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('tasks').select('id').lt('deadline', todayStr).neq('status', 'completed'),
        supabase.from('tasks')
            .select('*, profiles(full_name), projects!inner(title, clients!inner(company_name))')
            .order('created_at', { ascending: false }).limit(5),
        supabase.from('invoices')
            .select('status, grand_total, paid_amount, amount, client_id')
            .is('deleted_at', null),
        supabase.from('invoices')
            .select('grand_total, status')
            .is('deleted_at', null)
            .gte('issue_date', startOfMonth)
            .lte('issue_date', endOfMonth)
            .neq('status', 'cancelled')
            .neq('status', 'draft'),
        supabase.from('invoices')
            .select('grand_total')
            .is('deleted_at', null)
            .gte('issue_date', new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0])
            .lte('issue_date', new Date(currentYear, currentMonth, 0).toISOString().split('T')[0])
            .neq('status', 'cancelled')
            .neq('status', 'draft'),
        supabase.from('expenses')
            .select('amount, category')
            .is('deleted_at', null),
        supabase.from('expenses')
            .select('category, amount')
            .is('deleted_at', null)
            .gte('expense_date', startOfMonth)
            .lte('expense_date', endOfMonth),
        supabase.from('project_budgets').select('budget_amount'),
        supabase.from('equipment')
            .select('*', { count: 'exact', head: true }).eq('status', 'available').is('deleted_at', null),
        supabase.from('equipment')
            .select('*', { count: 'exact', head: true }).eq('status', 'checked_out').is('deleted_at', null),
        supabase.from('equipment')
            .select('*', { count: 'exact', head: true }).eq('status', 'maintenance').is('deleted_at', null),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('invoices')
            .select('issue_date, grand_total, status')
            .is('deleted_at', null)
            .gte('issue_date', startOfYear)
            .lte('issue_date', endOfMonth)
            .neq('status', 'cancelled')
            .neq('status', 'draft')
            .order('issue_date', { ascending: true }),
        supabase.from('invoices')
            .select('grand_total, client_id, clients(company_name)')
            .is('deleted_at', null)
            .neq('status', 'cancelled')
            .neq('status', 'draft'),
        supabase.from('tasks').select('*', { count: 'exact', head: true })
            .eq('status', 'completed')
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth),
        supabase.from('tasks').select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth),
    ])

    // ── Compute metrics ──
    const presentCount = (todayAttendance || []).length
    const onLeaveTodayCount = leaveRequestsToday?.length || 0

    const { data: todayAll } = await supabase
        .from('attendance').select('status').eq('date', todayStr)
    const absentTodayCount = todayAll?.filter(a => a.status === 'absent').length || 0
    const lateTodayCount = todayAll?.filter(a => a.status === 'late').length || 0

    const attRecords = last30DaysAttendance || []
    const empCount = totalEmployees ?? 0
    const totalWorkingDays = empCount > 0
        ? new Set(attRecords.map(a => a.date)).size * empCount
        : 1
    const presentRecords = attRecords.filter(a => a.status === 'present' || a.status === 'late').length
    const attendanceRate = totalWorkingDays > 0
        ? Math.round((presentRecords / totalWorkingDays) * 1000) / 10
        : 100

    const projects = allProjects || []
    const activeProjectsCount = projects.filter((p: any) => p.status === 'in_progress' || p.status === 'not_started').length
    const completedProjectsCount = projects.filter((p: any) => p.status === 'completed').length
    const totalProjects = projects.length
    const projectHealthPercent = totalProjects > 0
        ? Math.round((activeProjectsCount / totalProjects) * 100)
        : 100

    const overdueCount = overdueTasksData?.length || 0
    const completedCount = completedTasks || 0
    const onTimeCompletion = (completedCount + overdueCount) > 0
        ? Math.round((completedCount / Math.max(completedCount + overdueCount, 1)) * 100)
        : 100

    const invoiceList = invoices || []
    const draftInvoicesCount = invoiceList.filter(i => i.status === 'draft').length
    const activeInvoicesCount = invoiceList.filter(i => i.status === 'sent' || i.status === 'partially_paid').length
    const overdueInvoicesCount = invoiceList.filter(i => i.status === 'overdue').length
    const paidInvoicesCount = invoiceList.filter(i => i.status === 'paid').length

    const totalReceivableVal = invoiceList
        .filter(i => i.status === 'sent' || i.status === 'overdue' || i.status === 'partially_paid')
        .reduce((s: number, inv: any) => s + (Number(inv.grand_total) - Number(inv.paid_amount || 0)), 0)

    const revenueThisMonthVal = (thisMonthInvoices || []).reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0)
    const revenueLastMonthVal = (lastMonthInvoices || []).reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0)

    const totalExpensesVal = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0)
    const totalBudget = (projectBudgets || []).reduce((s: number, b: any) => s + Number(b.budget_amount || 0), 0)
    const budgetUtilizationVal = totalBudget > 0 ? Math.round((totalExpensesVal / totalBudget) * 100) : 0

    // Expense by category (this month)
    const categoryMap = new Map<string, number>()
    for (const exp of expensesWithCategory || []) {
        const cat = exp.category || 'Other'
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(exp.amount || 0))
    }
    const expenseByCategory = Array.from(categoryMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)

    // Monthly revenue data for charts
    const monthlyMap = new Map<string, number>()
    for (const inv of monthlyInvoices || []) {
        const d = new Date(inv.issue_date)
        const key = `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(inv.grand_total || 0))
    }
    const monthlyRevenueData = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({ month, revenue }))

    // Top clients by revenue
    const clientRevenueMap = new Map<string, number>()
    for (const inv of invoicesByClient || []) {
        const name = (inv as any).clients?.company_name || 'Unknown'
        clientRevenueMap.set(name, (clientRevenueMap.get(name) || 0) + Number(inv.grand_total || 0))
    }
    const topClients = Array.from(clientRevenueMap.entries())
        .map(([company_name, revenue]) => ({ company_name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

    const monthlyInvoicesPaidVal = (thisMonthInvoices || []).filter((i: any) => i.status === 'paid').length
    const monthlyInvoicesTotalVal = (thisMonthInvoices || []).length

    const data: FounderDashboardData = {
        totalEmployees: totalEmployees || 0,
        checkedInToday: presentCount,
        onLeaveToday: onLeaveTodayCount,
        absentToday: absentTodayCount,
        lateToday: lateTodayCount,
        attendanceRate,
        activeProjects: activeProjectsCount,
        completedProjects: completedProjectsCount,
        projectHealthPercent,
        pendingTasks: pendingTasks || 0,
        inProgressTasks: inProgressTasks || 0,
        completedTasks: completedCount,
        overdueTasks: overdueCount,
        onTimeCompletion,
        totalReceivable: totalReceivableVal,
        revenueThisMonth: revenueThisMonthVal,
        revenueLastMonth: revenueLastMonthVal,
        totalExpenses: totalExpensesVal,
        budgetUtilization: budgetUtilizationVal,
        draftInvoices: draftInvoicesCount,
        activeInvoices: activeInvoicesCount,
        overdueInvoices: overdueInvoicesCount,
        paidInvoices: paidInvoicesCount,
        equipmentAvailable: equipmentAvailable || 0,
        equipmentCheckedOut: equipmentCheckedOut || 0,
        equipmentInMaintenance: equipmentInMaintenance || 0,
        clientCount: clientCount || 0,
        totalMeetings: 0,
        month: monthStr,
        recentTasks: recentTasksResult?.data || [],
        todayAttendance: todayAttendance || [],
        expenseByCategory,
        monthlyRevenueData,
        topClients,
        completedTasksThisMonth: completedTasksThisMonth || 0,
        tasksThisMonth: tasksThisMonth || 0,
        monthlyInvoicesPaid: monthlyInvoicesPaidVal,
        monthlyInvoicesTotal: monthlyInvoicesTotalVal,
    }

    await globalCache.set(cacheKey, data, 60)
    return data
}

export default async function FounderDashboardPage() {
    const data = await fetchFounderDashboard()
    return <FounderDashboardClient data={data} />
}
