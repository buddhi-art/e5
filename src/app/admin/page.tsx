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

  const { data: dbMetrics, error } = await supabase.rpc('get_admin_dashboard_metrics', {
    p_today: todayStr,
    p_start_month: startOfMonth,
    p_end_month: endOfMonth,
    p_thirty_days_ago: thirtyDaysAgo,
    p_yesterday: yesterday
  })

  if (error || !dbMetrics) {
    console.error('Error fetching dashboard metrics', error)
    // Fallback if the RPC fails or hasn't been migrated yet (or we can just throw)
    // throw new Error('Failed to fetch dashboard metrics')
  }

  const {
    totalEmployees = 0, oldEmployeeCount = 0, clientCount = 0, activeProjectCount = 0, allProjectsCount = 0,
    recentTasks = [], todayAttendance = [], yesterdayPresent = 0, last30DaysAttendance = [], todayAllAttendance = [],
    pendingTasks = 0, inProgressTasks = 0, completedTasks = 0, overdueTasks = 0, invoicesData = [],
    thisMonthInvoices = [], lastMonthInvoices = [], expensesData = [], projectBudgets = [],
    pendingExpenses = 0, pendingLeaveRequests = 0, equipmentAvailable = 0, equipmentCheckedOut = 0,
    equipmentInMaintenance = 0, leaveRequestsToday = [], totalMeetings = 0, totalLeaveRequests = 0,
    completedTasksThisMonth = 0, tasksThisMonth = 0, invoicesThisMonthData = [], meetingsThisMonthCount = 0,
    activeClients = 0, projectsStatus = []
  } = (dbMetrics || {}) as any

  const employeeCountChange = totalEmployees - oldEmployeeCount

  const presentCount = todayAttendance.length
  const onLeaveToday = leaveRequestsToday.length
  const absentToday = todayAllAttendance.filter((a: any) => a.status === 'absent').length
  const lateToday = todayAllAttendance.filter((a: any) => a.status === 'late').length

  const totalWorkingDays = totalEmployees > 0 ? 30 * totalEmployees : 1
  const presentRecords = last30DaysAttendance.filter((a: any) => a.status === 'present' || a.status === 'late').length
  const attendanceRate = totalWorkingDays > 0 ? Math.round((presentRecords / totalWorkingDays) * 1000) / 10 : 100

  const attendanceTrend = yesterdayPresent > 0 ? Math.round(((presentCount - yesterdayPresent) / yesterdayPresent) * 100) : 0

  const totalTasks = pendingTasks + inProgressTasks + completedTasks
  const onTimeCompletion = totalTasks > 0 && completedTasks > 0
    ? Math.round((completedTasks / Math.max(completedTasks + overdueTasks, 1)) * 100)
    : 100

  const healthyProjects = projectsStatus.filter((p: any) => p.status === 'in_progress' || p.status === 'not_started').length
  const projectHealthPercent = allProjectsCount > 0 ? Math.round((healthyProjects / allProjectsCount) * 100) : 100

  const draftInvoices = invoicesData.filter((i: any) => i.status === 'draft').length
  const activeInvoices = invoicesData.filter((i: any) => i.status === 'sent' || i.status === 'partially_paid').length
  const overdueInvoices = invoicesData.filter((i: any) => i.status === 'overdue').length
  const paidInvoices = invoicesData.filter((i: any) => i.status === 'paid').length

  const totalReceivable = invoicesData
    .filter((i: any) => i.status === 'sent' || i.status === 'overdue' || i.status === 'partially_paid')
    .reduce((sum: number, inv: any) => sum + (Number(inv.grand_total) - Number(inv.paid_amount || 0)), 0)

  const actualRevenueThisMonth = thisMonthInvoices.reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0)
  const actualRevenueLastMonth = lastMonthInvoices.reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0)

  const totalExpenses = expensesData.reduce((s: number, e: any) => s + Number(e.amount || 0), 0)
  const totalBudget = projectBudgets.reduce((s: number, b: any) => s + Number(b.budget_amount || 0), 0)
  const budgetUtilization = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0

  const pendingApprovals = pendingExpenses + pendingLeaveRequests

  const monthlyInvoicesPaid = invoicesThisMonthData.filter((i: any) => i.status === 'paid').length
  const monthlyInvoicesTotal = invoicesThisMonthData.length

  const data: DashboardData = {
    employeeCount: totalEmployees,
    clientCount: clientCount,
    activeProjectCount: activeProjectCount,
    taskCount: totalTasks,
    recentTasks: recentTasks as TaskSummary[],
    todayAttendance: todayAttendance as AttendanceEntry[],
    totalEmployees: totalEmployees,
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
    totalLeaveRequests,
    employeeCountChange,
    attendanceTrend,
    completionTrend: 0,
    revenueThisMonth: actualRevenueThisMonth,
    revenueLastMonth: actualRevenueLastMonth,
    activeClients,
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
    meetingsThisMonth: meetingsThisMonthCount,
  }


  return data
}

export default async function AdminDashboard() {
  const data = await fetchDashboardData()

  return <AdminDashboardClient data={data} />
}
