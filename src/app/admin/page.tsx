import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from '@/components/admin-dashboard-client'
import { MONTHS } from '@/lib/utils'
import { TaskSummary, AttendanceEntry } from '@/types'

// Layer 2: ISR — Cache this page for 5 minutes
export const revalidate = 300

interface DashboardData {
  employeeCount: number
  clientCount: number
  activeProjectCount: number
  taskCount: number
  recentTasks: TaskSummary[]
  todayAttendance: AttendanceEntry[]
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
  const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]

  const thirtyDaysAgoDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgoISO = thirtyDaysAgoDate.toISOString()

  // Run all queries in parallel for maximum performance.
  // Each query is wrapped in error-handling so a single failure never
  // takes down the entire dashboard.
  const [
    employeeResult,
    clientResult,
    projectResult,
    taskResult,
    attendanceResult,
    invoicesResult,
    expensesResult,
    budgetsResult,
    equipmentResult,
    leaveResult,
    meetingsResult,
    activeClientsResult,
    projectsStatusResult,
  ] = await Promise.all([
    // Employees
    supabase.from('profiles').select('id, created_at', { count: 'exact', head: true }).eq('role', 'employee').is('deleted_at', null),
    // Clients
    supabase.from('clients').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    // Active projects
    supabase.from('projects').select('id', { count: 'exact', head: true }).neq('status', 'completed').is('deleted_at', null),
    // Tasks — recent 5 + counts
    supabase.from('tasks')
      .select(`
        id, title, status, created_at,
        assigned_to,
        project_id,
        deadline
      `)
      .order('created_at', { ascending: false })
      .limit(5),
    // Attendance
    (async () => {
      const [todayAtt, allToday, last30, yesterdayAtt] = await Promise.all([
        supabase.from('attendance')
          .select('id, created_at, user_id, status')
          .eq('date', todayStr)
          .not('status', 'in', '("absent","on_leave")')
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase.from('attendance')
          .select('status')
          .eq('date', todayStr)
          .is('deleted_at', null),
        supabase.from('attendance')
          .select('date, status')
          .gte('date', thirtyDaysAgo)
          .lte('date', todayStr)
          .is('deleted_at', null),
        supabase.from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('date', yesterday)
          .in('status', ['present', 'late'])
          .is('deleted_at', null),
      ])
      return { todayAtt, allToday, last30, yesterdayCount: yesterdayAtt.count ?? 0 }
    })(),
    // Invoices
    supabase.from('invoices')
      .select('status, grand_total, paid_amount, issue_date')
      .is('deleted_at', null),
    // Expenses
    supabase.from('expenses')
      .select('amount, status')
      .is('deleted_at', null),
    // Project budgets
    supabase.from('project_budgets')
      .select('budget_amount'),
    // Equipment
    (async () => {
      const [avail, checked, maint] = await Promise.all([
        supabase.from('equipment').select('id', { count: 'exact', head: true }).eq('status', 'available').is('deleted_at', null),
        supabase.from('equipment').select('id', { count: 'exact', head: true }).eq('status', 'checked_out').is('deleted_at', null),
        supabase.from('equipment').select('id', { count: 'exact', head: true }).eq('status', 'maintenance').is('deleted_at', null),
      ])
      return { available: avail.count ?? 0, checkedOut: checked.count ?? 0, maintenance: maint.count ?? 0 }
    })(),
    // Leave requests
    (async () => {
      const [pending, total, todayLeave] = await Promise.all([
        supabase.from('leave_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .is('deleted_at', null),
        supabase.from('leave_requests')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null),
        supabase.from('leave_requests')
          .select('id')
          .eq('status', 'approved')
          .is('deleted_at', null)
          .lte('start_date', todayStr)
          .gte('end_date', todayStr),
      ])
      return { pending: pending.count ?? 0, total: total.count ?? 0, todayLeave: todayLeave.data ?? [] }
    })(),
    // Meetings
    supabase.from('client_meetings').select('id, meeting_date', { count: 'exact', head: true }).is('deleted_at', null),
    // Active clients (projects that aren't completed or on hold)
    supabase.from('projects')
      .select('client_id')
      .not('status', 'in', '("completed","on_hold")')
      .is('deleted_at', null),
    // Project statuses
    supabase.from('projects').select('status').is('deleted_at', null),
  ])

  // ─── Safely extract all values with defaults ───

  const totalEmployees = employeeResult.count ?? 0
  const clientCount = clientResult.count ?? 0
  const activeProjectCount = projectResult.count ?? 0

  // Employees created more than 30 days ago
  let oldEmployeeCount = 0
  if (employeeResult.data) {
    oldEmployeeCount = employeeResult.data.filter(e => e.created_at && e.created_at < thirtyDaysAgoISO).length
  }

  // Recent tasks
  const recentTasks: TaskSummary[] = (taskResult.data ?? []).map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    created_at: t.created_at,
    profiles: null, // will resolve below
    projects: null,
  }))

  // Resolve task profiles and projects
  if (taskResult.data && taskResult.data.length > 0) {
    const userIds = taskResult.data.filter(t => t.assigned_to).map(t => t.assigned_to)
    const projectIds = taskResult.data.filter(t => t.project_id).map(t => t.project_id)

    const [profiles, projects] = await Promise.all([
      userIds.length > 0
        ? supabase.from('profiles').select('id, full_name').in('id', userIds)
        : { data: [] },
      projectIds.length > 0
        ? supabase.from('projects').select('id, title, client_id').in('id', projectIds)
        : { data: [] },
    ])

    const profileMap = new Map((profiles.data ?? []).map(p => [p.id, p.full_name]))
    const projectMap = new Map((projects.data ?? []).map(p => [p.id, p]))

    // Resolve client names for projects
    const clientIds = [...new Set((projects.data ?? []).filter(p => p.client_id).map(p => p.client_id))]
    const clientResult = clientIds.length > 0
      ? await supabase.from('clients').select('id, company_name').in('id', clientIds)
      : { data: [] }
    const clientNameMap = new Map((clientResult.data ?? []).map(c => [c.id, c.company_name]))

    for (const task of taskResult.data) {
      const taskSummary = recentTasks.find(rt => rt.id === task.id)
      if (!taskSummary) continue
      if (task.assigned_to && profileMap.has(task.assigned_to)) {
        taskSummary.profiles = { full_name: profileMap.get(task.assigned_to)! }
      }
      if (task.project_id && projectMap.has(task.project_id)) {
        const proj = projectMap.get(task.project_id)!
        taskSummary.projects = {
          title: proj.title,
          clients: proj.client_id && clientNameMap.has(proj.client_id)
            ? { company_name: clientNameMap.get(proj.client_id)! }
            : null,
        }
      }
    }
  }

  // Today attendance
  const todayAttData = (attendanceResult.todayAtt.data ?? [])
  const todayAllAttData = (attendanceResult.allToday.data ?? [])
  const last30DaysAttData = (attendanceResult.last30.data ?? [])
  const yesterdayPresent = attendanceResult.yesterdayCount

  const presentCount = todayAttData.length
  const onLeaveToday = leaveResult.todayLeave.length
  const absentToday = todayAllAttData.filter(a => a.status === 'absent').length
  const lateToday = todayAllAttData.filter(a => a.status === 'late').length

  const totalWorkingDays = totalEmployees > 0 ? 30 * totalEmployees : 1
  const presentRecords = last30DaysAttData.filter(a => a.status === 'present' || a.status === 'late').length
  const attendanceRate = totalWorkingDays > 0 ? Math.round((presentRecords / totalWorkingDays) * 1000) / 10 : 100

  const attendanceTrend = yesterdayPresent > 0
    ? Math.round(((presentCount - yesterdayPresent) / yesterdayPresent) * 100)
    : 0

  // Task counts
  const allTasks = taskResult.data ?? []
  const pendingTasks = allTasks.filter(t => t.status === 'pending').length
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length
  const completedTasks = allTasks.filter(t => t.status === 'completed').length
  const overdueTasks = allTasks.filter(t => {
    if (t.status === 'completed') return false
    if (!t.deadline) return false
    return new Date(t.deadline) < today
  }).length

  const totalTasks = pendingTasks + inProgressTasks + completedTasks
  const onTimeCompletion = totalTasks > 0 && completedTasks > 0
    ? Math.round((completedTasks / Math.max(completedTasks + overdueTasks, 1)) * 100)
    : 100

  // Monthly task completion
  const tasksThisMonth = allTasks.filter(t => {
    const created = new Date(t.created_at)
    return created >= new Date(startOfMonth) && created <= new Date(endOfMonth + 'T23:59:59.999Z')
  }).length
  const completedTasksThisMonth = allTasks.filter(t => {
    if (t.status !== 'completed') return false
    const created = new Date(t.created_at)
    return created >= new Date(startOfMonth) && created <= new Date(endOfMonth + 'T23:59:59.999Z')
  }).length

  // Invoice data
  const invoicesData = (invoicesResult.data ?? [])
  const draftInvoices = invoicesData.filter(i => i.status === 'draft').length
  const activeInvoices = invoicesData.filter(i => i.status === 'sent' || i.status === 'partially_paid').length
  const overdueInvoiceCount = invoicesData.filter(i => i.status === 'overdue').length
  const paidInvoices = invoicesData.filter(i => i.status === 'paid').length

  const totalReceivable = invoicesData
    .filter(i => i.status === 'sent' || i.status === 'overdue' || i.status === 'partially_paid')
    .reduce((sum, inv) => sum + (Number(inv.grand_total) - Number(inv.paid_amount || 0)), 0)

  const thisMonthInvoices = invoicesData.filter(i => {
    if (i.status === 'cancelled' || i.status === 'draft') return false
    if (!i.issue_date) return false
    return i.issue_date >= startOfMonth && i.issue_date <= endOfMonth
  })
  const lastMonthInvoicesStart = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0]
  const lastMonthInvoices = invoicesData.filter(i => {
    if (i.status === 'cancelled' || i.status === 'draft') return false
    if (!i.issue_date) return false
    return i.issue_date >= lastMonthInvoicesStart && i.issue_date < startOfMonth
  })

  const revenueThisMonth = thisMonthInvoices.reduce((s, i) => s + Number(i.grand_total || 0), 0)
  const revenueLastMonth = lastMonthInvoices.reduce((s, i) => s + Number(i.grand_total || 0), 0)

  const invoicesThisMonthData = invoicesData.filter(i => {
    if (!i.issue_date) return false
    return i.issue_date >= startOfMonth && i.issue_date <= endOfMonth
  })
  const monthlyInvoicesPaid = invoicesThisMonthData.filter(i => i.status === 'paid').length
  const monthlyInvoicesTotal = invoicesThisMonthData.length

  // Expenses
  const expensesData = (expensesResult.data ?? [])
  const totalExpenses = expensesData.reduce((s, e) => s + Number(e.amount || 0), 0)
  const pendingExpenses = expensesData.filter(e => e.status === 'pending').length

  // Project budgets
  const projectBudgets = (budgetsResult.data ?? [])
  const totalBudget = projectBudgets.reduce((s, b) => s + Number(b.budget_amount || 0), 0)
  const budgetUtilization = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0

  // Equipment
  const equipmentAvailable = equipmentResult.available
  const equipmentCheckedOut = equipmentResult.checkedOut
  const equipmentInMaintenance = equipmentResult.maintenance

  // Leave
  const totalLeaveRequests = leaveResult.total
  const pendingLeaveRequests = leaveResult.pending
  const pendingApprovals = pendingExpenses + pendingLeaveRequests

  // Meetings
  const totalMeetings = meetingsResult.count ?? 0
  const meetingsThisMonth = (meetingsResult.data ?? []).filter(m => {
    if (!m.meeting_date) return false
    return m.meeting_date >= startOfMonth && m.meeting_date <= endOfMonth
  }).length

  // Active clients (distinct clients with non-completed, non-on-hold projects)
  const activeProjectsData = activeClientsResult.data ?? []
  const activeClientIds = new Set(activeProjectsData.filter(p => p.client_id).map(p => p.client_id))
  const activeClientCount = activeClientIds.size

  // Project health
  const projectsStatusData = projectsStatusResult.data ?? []
  const allProjectsCount = projectsStatusData.length
  const healthyProjects = projectsStatusData.filter(p => p.status === 'in_progress' || p.status === 'not_started').length
  const projectHealthPercent = allProjectsCount > 0 ? Math.round((healthyProjects / allProjectsCount) * 100) : 100

  // Employee count change
  const employeeCountChange = totalEmployees - oldEmployeeCount

  // Build todayAttendance for the display
  const todayAttendance: AttendanceEntry[] = todayAttData.map(a => ({
    id: a.id,
    created_at: new Date(a.created_at).toISOString(),
    status: a.status ?? 'present',
    profiles: null,
  }))

  // Resolve attendance profile names
  if (todayAttData.length > 0) {
    const attUserIds = [...new Set(todayAttData.filter(a => a.user_id).map(a => a.user_id))]
    if (attUserIds.length > 0) {
      const { data: attProfiles } = await supabase.from('profiles').select('id, full_name').in('id', attUserIds)
      const attProfileMap = new Map((attProfiles ?? []).map(p => [p.id, p.full_name]))
      for (const entry of todayAttendance) {
        const user = todayAttData.find(a => a.id === entry.id)
        if (user && user.user_id && attProfileMap.has(user.user_id)) {
          entry.profiles = { full_name: attProfileMap.get(user.user_id)! }
        }
      }
    }
  }

  const completionTrend = 0

  const data: DashboardData = {
    employeeCount: totalEmployees,
    clientCount,
    activeProjectCount,
    taskCount: totalTasks,
    recentTasks,
    todayAttendance,
    totalEmployees,
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
    overdueInvoices: overdueInvoiceCount,
    draftInvoices,
    paidInvoices,
    totalReceivable,
    totalExpenses,
    budgetUtilization,
    pendingApprovals,
    totalLeaveRequests,
    employeeCountChange,
    attendanceTrend,
    completionTrend,
    revenueThisMonth,
    revenueLastMonth,
    activeClients: activeClientCount,
    projectHealthPercent,
    equipmentCheckedOut,
    equipmentInMaintenance,
    equipmentAvailable,
    totalMeetings,
    month: monthStr,
    completedTasksThisMonth,
    tasksThisMonth,
    monthlyInvoicesPaid,
    monthlyInvoicesTotal,
    meetingsThisMonth,
  }

  return data
}

export default async function AdminDashboard() {
  const data = await fetchDashboardData()

  // Detect insufficient data — if no employees, invoices, or tasks
  const insufficientData =
    data.totalEmployees === 0 ||
    (data.totalEmployees <= 1 && data.activeInvoices === 0 && data.taskCount === 0)

  return <AdminDashboardClient data={data} insufficientData={insufficientData} />
}
