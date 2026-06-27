import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from '@/components/admin-dashboard-client'
import globalCache from '@/lib/cache'

// Layer 2: ISR — Cache this page for 5 minutes
export const revalidate = 300

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

interface DashboardData {
  employeeCount: number
  clientCount: number
  activeProjectCount: number
  taskCount: number
  recentTasks: any[]
  todayAttendance: any[]
  totalEmployees: number
  checkedInToday: number
  onLeaveToday: number
  absentToday: number
  lateToday: number
  attendanceRate: number
  pendingTasks: number
  inProgressTasks: number
  overdueTasks: number
  completedTasks: number
  onTimeCompletion: number
  activeInvoices: number
  overdueInvoices: number
  draftInvoices: number
  paidInvoices: number
  totalReceivable: number
  totalExpenses: number
  budgetUtilization: number
  pendingApprovals: number
  totalLeaveRequests: number
  employeeCountChange: number
  attendanceTrend: number
  completionTrend: number
  revenueThisMonth: number
  revenueLastMonth: number
  activeClients: number
  projectHealthPercent: number
  equipmentCheckedOut: number
  equipmentInMaintenance: number
  equipmentAvailable: number
  totalMeetings: number
  month: string
  completedTasksThisMonth: number
  tasksThisMonth: number
  monthlyInvoicesPaid: number
  monthlyInvoicesTotal: number
  meetingsThisMonth: number
}

async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const monthStr = `${MONTHS[currentMonth]} ${currentYear}`
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]

  // Try cache first — keyed by month so it auto-invalidates at month boundary
  const cacheKey = `admin_dashboard_${monthStr}_${todayStr}`
  const cached = globalCache.get<DashboardData>(cacheKey)
  if (cached) return cached

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
    { data: invoicesData } = { data: [] },
    { count: invoicesThisMonthCount } = { count: 0 },
    { count: invoicesLastMonthCount } = { count: 0 },
    { data: expensesData } = { data: [] },
    { data: expensesThisMonth } = { data: [] },
    { data: projectBudgets } = { data: [] },
    { count: pendingExpenses } = { count: 0 },
    { count: pendingLeaveRequests } = { count: 0 },
    { count: equipmentAvailable } = { count: 0 },
    { count: equipmentCheckedOut } = { count: 0 },
    { count: equipmentInMaintenance } = { count: 0 },
    { data: leaveRequestsToday } = { data: [] },
    { count: totalMeetings } = { count: 0 },
    { count: totalLeaveRequests } = { count: 0 },
    { count: completedTasksThisMonth } = { count: 0 },
    { count: tasksThisMonth } = { count: 0 },
    { data: invoicesThisMonthData } = { data: [] },
    { count: meetingsThisMonthCount } = { count: 0 },
    activeClientsResult,
    projectsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('role', 'employee').is('deleted_at', null),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('role', 'employee').is('deleted_at', null)
      .lt('created_at', thirtyDaysAgo),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true })
      .neq('status', 'completed'),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('tasks')
      .select('*, profiles(full_name), projects!inner(title, clients!inner(company_name))')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('attendance')
      .select('*, profiles(full_name)')
      .eq('date', todayStr)
      .neq('status', 'absent')
      .neq('status', 'on_leave')
      .order('created_at', { ascending: false }),
    supabase.from('attendance')
      .select('status')
      .eq('date', new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    supabase.from('attendance')
      .select('status, date')
      .gte('date', thirtyDaysAgo)
      .lte('date', todayStr),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress'),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .lt('deadline', todayStr)
      .neq('status', 'completed'),
    supabase.from('invoices')
      .select('status, grand_total, paid_amount, amount')
      .is('deleted_at', null),
    supabase.from('invoices')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('issue_date', startOfMonth)
      .lte('issue_date', endOfMonth),
    supabase.from('invoices')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('issue_date', new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0])
      .lte('issue_date', new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]),
    supabase.from('expenses')
      .select('amount')
      .is('deleted_at', null),
    supabase.from('expenses')
      .select('amount')
      .is('deleted_at', null)
      .gte('expense_date', startOfMonth)
      .lte('expense_date', endOfMonth),
    supabase.from('project_budgets')
      .select('budget_amount'),
    supabase.from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('deleted_at', null),
    supabase.from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('deleted_at', null),
    supabase.from('equipment')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')
      .is('deleted_at', null),
    supabase.from('equipment')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'checked_out')
      .is('deleted_at', null),
    supabase.from('equipment')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'maintenance')
      .is('deleted_at', null),
    supabase.from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .is('deleted_at', null)
      .lte('start_date', todayStr)
      .gte('end_date', todayStr),
    supabase.from('client_meetings')
      .select('*', { count: 'exact', head: true }),
    supabase.from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth),
    supabase.from('invoices')
      .select('status')
      .is('deleted_at', null)
      .gte('issue_date', startOfMonth)
      .lte('issue_date', endOfMonth),
    supabase.from('client_meetings')
      .select('*', { count: 'exact', head: true })
      .gte('meeting_date', startOfMonth)
      .lte('meeting_date', endOfMonth),
    supabase.from('projects')
      .select('client_id')
      .neq('status', 'completed')
      .neq('status', 'on_hold'),
    supabase.from('projects')
      .select('status'),
  ])

  // ──────────────────────────────────────────────
  // Compute People & Attendance Metrics
  // ──────────────────────────────────────────────
  const totalEmployeesCount = totalEmployees || 0
  const oldEmployeeCount = employeeCountChangeResult?.count || 0
  const employeeCountChange = totalEmployeesCount - oldEmployeeCount

  const todayRaw = todayAttendanceResult?.data || []
  const presentCount = todayRaw.length
  const onLeaveToday = leaveRequestsToday?.length || 0

  const { data: todayAllAttendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('date', todayStr)

  const absentToday = todayAllAttendance?.filter(a => a.status === 'absent').length || 0
  const lateToday = todayAllAttendance?.filter(a => a.status === 'late').length || 0

  const attRecords = last30DaysAttendance || []
  const totalWorkingDays = totalEmployeesCount > 0
    ? new Set(attRecords.map(a => a.date)).size * totalEmployeesCount
    : 1
  const presentRecords = attRecords.filter(a => a.status === 'present' || a.status === 'late').length
  const attendanceRate = totalWorkingDays > 0
    ? Math.round((presentRecords / totalWorkingDays) * 1000) / 10
    : 100

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

  const onTimeCompletion = totalTasks > 0 && completedTasks > 0
    ? Math.round((completedTasks / Math.max(completedTasks + overdueTasks, 1)) * 100)
    : 100

  const recentTasks = (recentTasksResult?.data || [])

  const allProjects = projectsResult?.data || []
  const totalProjects = allProjects.length
  const healthyProjects = allProjects.filter((p: any) =>
    p.status === 'in_progress' || p.status === 'not_started'
  ).length
  const projectHealthPercent = totalProjects > 0
    ? Math.round((healthyProjects / totalProjects) * 100)
    : 100

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

  const totalExpenses = (expensesData || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0)

  const totalBudget = (projectBudgets || []).reduce((s: number, b: any) => s + Number(b.budget_amount || 0), 0)
  const budgetUtilization = totalBudget > 0
    ? Math.round((totalExpenses / totalBudget) * 100)
    : 0

  const pendingApprovals = (pendingExpenses || 0) + (pendingLeaveRequests || 0)

  // ──────────────────────────────────────────────
  // Compute Equipment Metrics
  // ──────────────────────────────────────────────
  const equipAvailable = equipmentAvailable || 0
  const equipCheckedOut = equipmentCheckedOut || 0
  const equipInMaintenance = equipmentInMaintenance || 0

  const meetingsCount = totalMeetings || 0

  const todayAttendance = (todayAttendanceResult?.data || []).slice(0, 20)

  // ──────────────────────────────────────────────
  // Monthly-windowed domain score data
  // ──────────────────────────────────────────────
  const completedTasksThisMonthVal = completedTasksThisMonth || 0
  const tasksThisMonthVal = tasksThisMonth || 0
  const monthlyInvoicesList = invoicesThisMonthData || []
  const monthlyInvoicesPaid = monthlyInvoicesList.filter((i: any) => i.status === 'paid').length
  const monthlyInvoicesTotal = monthlyInvoicesList.length
  const meetingsThisMonthVal = meetingsThisMonthCount || 0

  const data: DashboardData = {
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
    completionTrend: 0,
    revenueThisMonth: actualRevenueThisMonth,
    revenueLastMonth: actualRevenueLastMonth,
    activeClients,
    projectHealthPercent,
    equipmentCheckedOut: equipCheckedOut,
    equipmentInMaintenance: equipInMaintenance,
    equipmentAvailable: equipAvailable,
    totalMeetings: meetingsCount,
    month: monthStr,
    completedTasksThisMonth: completedTasksThisMonthVal,
    tasksThisMonth: tasksThisMonthVal,
    monthlyInvoicesPaid,
    monthlyInvoicesTotal,
    meetingsThisMonth: meetingsThisMonthVal,
  }

  // Store in-memory cache for 60 seconds (dashboard is updated frequently)
  globalCache.set(cacheKey, data, 60)

  return data
}

export default async function AdminDashboard() {
  const data = await fetchDashboardData()

  return <AdminDashboardClient data={data} />
}
