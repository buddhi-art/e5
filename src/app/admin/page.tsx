import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from '@/components/admin-dashboard-client'

// Layer 2: ISR — Cache this page for 5 minutes
export const revalidate = 300

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export default async function AdminDashboard() {
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const monthStr = `${MONTHS[currentMonth]} ${currentYear}`
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]

  // ──────────────────────────────────────────────
  // Parallel queries for all dashboard metrics
  // ──────────────────────────────────────────────
  const [
    { count: totalEmployees } = { count: 0 },
    employeeCountChangeResult,
    { count: clientCount } = { count: 0 },
    { count: activeProjectCount } = { count: 0 },
    { count: allProjectsCount } = { count: 0 },
    recentTasksResult,
    todayAttendanceResult,
    { data: attendanceYesterdayData } = { data: [] },
    { data: last30DaysAttendance } = { data: [] },
    pendingTasksResult,
    inProgressTasksResult,
    completedTasksResult,
    overdueTasksResult,
    // Invoices
    { data: invoicesData } = { data: [] },
    // Invoice revenue — issued this month
    { count: invoicesThisMonthCount } = { count: 0 },
    // Invoice revenue — issued last month
    { count: invoicesLastMonthCount } = { count: 0 },
    // Expenses
    { data: expensesData } = { data: [] },
    { data: expensesThisMonth } = { data: [] },
    { data: projectBudgets } = { data: [] },
    // Pending approvals
    { count: pendingExpenses } = { count: 0 },
    { count: pendingLeaveRequests } = { count: 0 },
    // Equipment
    { count: equipmentAvailable } = { count: 0 },
    { count: equipmentCheckedOut } = { count: 0 },
    { count: equipmentInMaintenance } = { count: 0 },
    // Leave today
    { data: leaveRequestsToday } = { data: [] },
    // All meetings (lifetime)
    { count: totalMeetings } = { count: 0 },
    // All leave requests count
    { count: totalLeaveRequests } = { count: 0 },
    // Completed tasks this month (for Task Completion domain score)
    { count: completedTasksThisMonth } = { count: 0 },
    // All tasks created this month (for domain score denominator)
    { count: tasksThisMonth } = { count: 0 },
    // Invoices issued this month with statuses (for monthly Collection Rate)
    { data: invoicesThisMonthData } = { data: [] },
    // Meetings this month (for Client Engagements domain score)
    { count: meetingsThisMonthCount } = { count: 0 },
    // Active clients — project client_ids for active projects
    activeClientsResult,
    // Project health
    projectsResult,
  ] = await Promise.all([
    // Total employees (not deleted)
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('role', 'employee').is('deleted_at', null),

    // Employee count change — count employees created before 30 days ago
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('role', 'employee').is('deleted_at', null)
      .lt('created_at', thirtyDaysAgo),

    // All clients
    supabase.from('clients').select('*', { count: 'exact', head: true }),

    // Active projects (not completed)
    supabase.from('projects').select('*', { count: 'exact', head: true })
      .neq('status', 'completed'),

    // All projects (for health %)
    supabase.from('projects').select('*', { count: 'exact', head: true }),

    // Recent tasks
    supabase.from('tasks')
      .select('*, profiles(full_name), projects!inner(title, clients!inner(company_name))')
      .order('created_at', { ascending: false }).limit(5),

    // Today attendance (checked in / present)
    supabase.from('attendance')
      .select('*, profiles(full_name)')
      .eq('date', todayStr)
      .neq('status', 'absent')
      .neq('status', 'on_leave')
      .order('created_at', { ascending: false }),

    // Yesterday attendance (for trend)
    supabase.from('attendance')
      .select('status')
      .eq('date', new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),

    // Last 30 days attendance for attendance rate calculation
    supabase.from('attendance')
      .select('status, date')
      .gte('date', thirtyDaysAgo)
      .lte('date', todayStr),

    // Pending tasks (todo)
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // In progress tasks
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress'),

    // Completed tasks (lifetime)
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),

    // Overdue tasks (deadline before today, not completed)
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .lt('deadline', todayStr)
      .neq('status', 'completed'),

    // All invoices (for breakdown)
    supabase.from('invoices')
      .select('status, grand_total, paid_amount, amount')
      .is('deleted_at', null),

    // Revenue this month (invoices issued this month)
    supabase.from('invoices')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('issue_date', startOfMonth)
      .lte('issue_date', endOfMonth),

    // Revenue last month
    supabase.from('invoices')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('issue_date', new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0])
      .lte('issue_date', new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]),

    // All non-deleted expenses (for total)
    supabase.from('expenses')
      .select('amount')
      .is('deleted_at', null),

    // Expenses this month
    supabase.from('expenses')
      .select('amount')
      .is('deleted_at', null)
      .gte('expense_date', startOfMonth)
      .lte('expense_date', endOfMonth),

    // Project budgets total
    supabase.from('project_budgets')
      .select('budget_amount'),

    // Pending expenses
    supabase.from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('deleted_at', null),

    // Pending leave requests
    supabase.from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('deleted_at', null),

    // Available equipment
    supabase.from('equipment')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')
      .is('deleted_at', null),

    // Checked out equipment
    supabase.from('equipment')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'checked_out')
      .is('deleted_at', null),

    // In maintenance equipment
    supabase.from('equipment')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'maintenance')
      .is('deleted_at', null),

    // Leave requests covering today
    supabase.from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .is('deleted_at', null)
      .lte('start_date', todayStr)
      .gte('end_date', todayStr),

    // All meetings (lifetime)
    supabase.from('client_meetings')
      .select('*', { count: 'exact', head: true }),

    // Total leave requests (non-deleted)
    supabase.from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),

    // NEW: Completed tasks this month (for Task Completion domain score)
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth),

    // NEW: All tasks created this month (for domain score denominator)
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth),

    // NEW: Invoices issued this month with statuses (for monthly Collection Rate)
    supabase.from('invoices')
      .select('status')
      .is('deleted_at', null)
      .gte('issue_date', startOfMonth)
      .lte('issue_date', endOfMonth),

    // NEW: Meetings this month (for Client Engagements domain score)
    supabase.from('client_meetings')
      .select('*', { count: 'exact', head: true })
      .gte('meeting_date', startOfMonth)
      .lte('meeting_date', endOfMonth),

    // Active clients — client_ids from active projects
    supabase.from('projects')
      .select('client_id')
      .neq('status', 'completed')
      .neq('status', 'on_hold'),

    // All projects (for health calculation)
    supabase.from('projects')
      .select('status'),
  ])

  // ──────────────────────────────────────────────
  // Compute People & Attendance Metrics
  // ──────────────────────────────────────────────
  const totalEmployeesCount = totalEmployees || 0
  const oldEmployeeCount = employeeCountChangeResult?.count || 0
  const employeeCountChange = totalEmployeesCount - oldEmployeeCount

  // Today's attendance breakdown
  const todayRaw = todayAttendanceResult?.data || []
  const presentCount = todayRaw.length  // we already filtered to non-absent, non-leave
  const onLeaveToday = leaveRequestsToday?.length || 0

  // Get today's full attendance data for absent/late
  const { data: todayAllAttendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('date', todayStr)

  const absentToday = todayAllAttendance?.filter(a => a.status === 'absent').length || 0
  const lateToday = todayAllAttendance?.filter(a => a.status === 'late').length || 0
  const _halfDayToday = todayAllAttendance?.filter(a => a.status === 'half-day').length || 0

  // Attendance rate over last 30 days
  const attRecords = last30DaysAttendance || []
  const totalWorkingDays = totalEmployeesCount > 0
    ? new Set(attRecords.map(a => a.date)).size * totalEmployeesCount
    : 1
  const presentRecords = attRecords.filter(a => a.status === 'present' || a.status === 'late').length
  const attendanceRate = totalWorkingDays > 0
    ? Math.round((presentRecords / totalWorkingDays) * 1000) / 10
    : 100

  // Attendance trend — compare today's presence to yesterday
  const yesterdayPresent = attendanceYesterdayData?.filter((a: any) =>
    a.status === 'present' || a.status === 'late'
  ).length || 0
  const attendanceTrend = yesterdayPresent > 0
    ? Math.round(((presentCount - yesterdayPresent) / yesterdayPresent) * 100)
    : 0

  // ──────────────────────────────────────────────
  // Compute Production & Task Metrics
  // ──────────────────────────────────────────────
  const pendingTasks = pendingTasksResult?.count || 0
  const inProgressTasks = inProgressTasksResult?.count || 0
  const completedTasks = completedTasksResult?.count || 0
  const overdueTasks = overdueTasksResult?.count || 0
  const totalTasks = pendingTasks + inProgressTasks + completedTasks

  // On-time completion rate
  const onTimeCompletion = totalTasks > 0 && completedTasks > 0
    ? Math.round((completedTasks / Math.max(completedTasks + overdueTasks, 1)) * 100)
    : 100

  const completionTrend = 0

  // Recent tasks
  const recentTasks = (recentTasksResult?.data || [])

  // Project health
  const allProjects = projectsResult?.data || []
  const totalProjects = allProjects.length
  const healthyProjects = allProjects.filter(p =>
    p.status === 'in_progress' || p.status === 'not_started'
  ).length
  const projectHealthPercent = totalProjects > 0
    ? Math.round((healthyProjects / totalProjects) * 100)
    : 100

  // Active clients — unique client_ids from active projects
  const activeClientIds = activeClientsResult?.data
    ? [...new Set((activeClientsResult.data as { client_id: string }[]).map(p => p.client_id))]
    : []
  const activeClients = activeClientIds.length

  // ──────────────────────────────────────────────
  // Compute Finance Metrics
  // ──────────────────────────────────────────────
  const invoices = invoicesData || []
  const draftInvoices = invoices.filter(i => i.status === 'draft').length
  const activeInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'partially_paid').length
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length
  const paidInvoices = invoices.filter(i => i.status === 'paid').length

  const totalReceivable = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue' || i.status === 'partially_paid')
    .reduce((sum: number, inv: any) => sum + (Number(inv.grand_total) - Number(inv.paid_amount || 0)), 0)

  // Revenue this month vs last month — query invoices by issue_date range
  const { data: thisMonthInvoices } = await supabase
    .from('invoices')
    .select('grand_total, status')
    .is('deleted_at', null)
    .gte('issue_date', startOfMonth)
    .lte('issue_date', endOfMonth)
    .neq('status', 'cancelled')
    .neq('status', 'draft')

  const { data: lastMonthInvoices } = await supabase
    .from('invoices')
    .select('grand_total, status')
    .is('deleted_at', null)
    .gte('issue_date', new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0])
    .lte('issue_date', new Date(currentYear, currentMonth, 0).toISOString().split('T')[0])
    .neq('status', 'cancelled')
    .neq('status', 'draft')

  const actualRevenueThisMonth = (thisMonthInvoices || []).reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0)
  const actualRevenueLastMonth = (lastMonthInvoices || []).reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0)

  // Total expenses
  const totalExpenses = (expensesData || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0)

  // Budget utilization
  const totalBudget = (projectBudgets || []).reduce((s: number, b: any) => s + Number(b.budget_amount || 0), 0)
  const budgetUtilization = totalBudget > 0
    ? Math.round((totalExpenses / totalBudget) * 100)
    : 0

  // Pending approvals
  const pendingApprovals = (pendingExpenses || 0) + (pendingLeaveRequests || 0)

  // ──────────────────────────────────────────────
  // Compute Equipment Metrics
  // ──────────────────────────────────────────────
  const equipAvailable = equipmentAvailable || 0
  const equipCheckedOut = equipmentCheckedOut || 0
  const equipInMaintenance = equipmentInMaintenance || 0

  // Lifetime meetings (for stat card subtitle)
  const meetingsCount = totalMeetings || 0

  // Today attendance for display
  const todayAttendance = (todayAttendanceResult?.data || []).slice(0, 20)

  // ──────────────────────────────────────────────
  // Monthly-windowed domain score data
  // ──────────────────────────────────────────────
  // Task Completion: tasks completed this month ÷ tasks created this month
  const completedTasksThisMonthVal = completedTasksThisMonth || 0
  const tasksThisMonthVal = tasksThisMonth || 0

  // Collection Rate (monthly): paid invoices issued this month ÷ all invoices issued this month
  const monthlyInvoicesList = invoicesThisMonthData || []
  const monthlyInvoicesPaid = monthlyInvoicesList.filter((i: any) => i.status === 'paid').length
  const monthlyInvoicesTotal = monthlyInvoicesList.length

  // Client Engagements (monthly): meetings this month
  const meetingsThisMonthVal = meetingsThisMonthCount || 0

  return (
    <AdminDashboardClient
      data={{
        employeeCount: totalEmployeesCount,
        clientCount: clientCount || 0,
        activeProjectCount: activeProjectCount || 0,
        taskCount: totalTasks,
        recentTasks: (recentTasks || []) as any,
        todayAttendance: (todayAttendance || []) as any,
        totalEmployees: totalEmployeesCount,
        checkedInToday: presentCount,
        onLeaveToday,
        absentToday,
        lateToday,
        attendanceRate,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        completedTasks,
        onTimeCompletion,
        activeInvoices,
        overdueInvoices,
        draftInvoices,
        paidInvoices,
        totalReceivable,
        totalExpenses,
        budgetUtilization,
        pendingApprovals,
        totalLeaveRequests: totalLeaveRequests || 0,
        employeeCountChange,
        attendanceTrend,
        completionTrend,
        revenueThisMonth: actualRevenueThisMonth,
        revenueLastMonth: actualRevenueLastMonth,
        activeClients,
        projectHealthPercent,
        equipmentCheckedOut: equipCheckedOut,
        equipmentInMaintenance: equipInMaintenance,
        equipmentAvailable: equipAvailable,
        totalMeetings: meetingsCount,
        month: monthStr,
        // New monthly-windowed domain score fields
        completedTasksThisMonth: completedTasksThisMonthVal,
        tasksThisMonth: tasksThisMonthVal,
        monthlyInvoicesPaid,
        monthlyInvoicesTotal,
        meetingsThisMonth: meetingsThisMonthVal,
      }}
    />
  )
}
