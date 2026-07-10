'use client'

import Link from 'next/link'
import {
    Users, UserSquare2, FolderKanban, CheckSquare, ClipboardList,
    Clock, CalendarCheck, Briefcase, DollarSign, Activity, Sparkles,
    AlertTriangle, Timer, CalendarOff, Receipt, FileText, Camera,
    Target, Percent, BarChart3, HeartPulse, Gauge, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HealthScore } from '@/components/dashboard/health-score'
import { StatCard } from '@/components/dashboard/stat-card'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { SectionHeader } from '@/components/dashboard/section-header'
import { MiniProgress } from '@/components/dashboard/mini-progress'
import { QuickAction } from '@/components/dashboard/quick-action'
import { DomainScore } from '@/components/dashboard/domain-score'

/* ──────────────────────────────────────
 Types
 ────────────────────────────────────── */
export interface TaskSummary {
    id: string
    title: string
    status: string
    created_at: string
    profiles: { full_name: string } | null
    projects: { title: string; clients: { company_name: string } | null } | null
}

export interface AttendanceEntry {
    id: string
    created_at: string
    profiles: { full_name: string } | null
}

export interface HealthMetrics {
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

/* ──────────────────────────────────────
 Health Score Calculation Helpers
 ────────────────────────────────────── */
function computeHealthScore(data: HealthMetrics): number {
    const attendanceWeight = 0.25
    const taskWeight = 0.25
    const financeWeight = 0.2
    const projectWeight = 0.15
    const equipmentWeight = 0.15

    const taskHealth =
        data.completedTasks + data.inProgressTasks > 0
            ? Math.round((data.onTimeCompletion / 100) * 100)
            : 50

    const financeHealth =
        data.totalExpenses > 0
            ? Math.round((1 - Math.min(data.budgetUtilization / 100, 1)) * 100)
            : 70

    const equipHealth =
        data.equipmentAvailable +
            data.equipmentCheckedOut +
            data.equipmentInMaintenance >
            0
            ? Math.round(
                (data.equipmentAvailable /
                    (data.equipmentAvailable +
                        data.equipmentCheckedOut +
                        data.equipmentInMaintenance)) *
                100,
            )
            : 80

    return Math.round(
        data.attendanceRate * attendanceWeight +
        taskHealth * taskWeight +
        financeHealth * financeWeight +
        data.projectHealthPercent * projectWeight +
        equipHealth * equipmentWeight,
    )
}

/* ──────────────────────────────────────
 Main Dashboard Client Component
 ────────────────────────────────────── */
export function AdminDashboardClient({
    data,
    insufficientData,
}: {
    data: HealthMetrics
    insufficientData?: boolean
}) {
    const {
        totalEmployees,
        checkedInToday,
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
        employeeCountChange,
        completionTrend,
        revenueThisMonth,
        revenueLastMonth,
        activeClients,
        projectHealthPercent,
        equipmentCheckedOut,
        equipmentInMaintenance,
        equipmentAvailable,
        clientCount,
        totalMeetings,
        month,
        activeProjectCount,
        recentTasks,
        todayAttendance,
        completedTasksThisMonth,
        tasksThisMonth,
        monthlyInvoicesPaid,
        monthlyInvoicesTotal,
        meetingsThisMonth,
    } = data

    const healthScore = computeHealthScore(data)

    const employeeTrend =
        employeeCountChange > 0
            ? ({ direction: 'up' as const, text: `+${employeeCountChange}` } as const)
            : employeeCountChange < 0
                ? ({
                    direction: 'down' as const,
                    text: `${employeeCountChange}`,
                } as const)
                : undefined

    const totalTasks = pendingTasks + inProgressTasks + completedTasks

    return (
        <div className="space-y-8 lg:space-y-12 overflow-x-hidden w-full max-w-full">
            {/* ─── HEADER ─── */}
            <section className="morph-fade-in">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="max-w-3xl">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                            Operations Dashboard
                        </h1>
                        <p className="text-base text-on-surface-variant mt-2">
                            {month} ecosystem analysis &mdash; {totalEmployees} employees,{' '}
                            {activeProjectCount} active projects, {activeClients} active
                            clients.
                        </p>
                    </div>
                    <HealthScore score={healthScore} />
                </div>
            </section>

            {/* ─── INSUFFICIENT DATA BANNER ─── */}
            {insufficientData && (
                <section className="morph-fade-in">
                    <div className="rounded-2xl bg-m3-warning-subtle border border-m3-warning p-6 text-center">
                        <div className="w-12 h-12 rounded-xl bg-m3-warning-subtle flex items-center justify-center mx-auto mb-3">
                            <AlertTriangle className="w-6 h-6 text-m3-warning" />
                        </div>
                        <h2 className="text-lg font-semibold text-m3-warning mb-1">
                            Insufficient Data
                        </h2>
                        <p className="text-sm text-m3-warning max-w-md mx-auto">
                            The dashboard needs real data to calculate accurate health scores.
                            Start by adding employees, creating invoices, and assigning tasks.
                            Once data flows in, the health score will self-correct
                            automatically.
                        </p>
                        <div className="flex items-center justify-center gap-3 mt-4">
                            <QuickAction
                                label="Add Employee"
                                href="/admin/employees"
                                icon={Users}
                                color="primary"
                            />
                            <QuickAction
                                label="Create Invoice"
                                href="/admin/invoices/new"
                                icon={DollarSign}
                                color="tertiary"
                            />
                            <QuickAction
                                label="Assign Task"
                                href="/admin/tasks"
                                icon={Briefcase}
                                color="secondary"
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* ─── PEOPLE DOMAIN ─── */}
            <section className="morph-fade-in morph-delay-2">
                <SectionHeader
                    icon={Users}
                    title="People & Attendance"
                    subtitle={`${checkedInToday} checked in today \u00b7 ${attendanceRate}% attendance rate`}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <StatCard
                        label="Total Employees"
                        value={totalEmployees}
                        icon={Users}
                        href="/admin/employees"
                        color="primary"
                        trend={employeeTrend}
                        delay={40}
                    />
                    <StatCard
                        label="Checked In"
                        value={checkedInToday}
                        icon={CalendarCheck}
                        href="/admin/attendance"
                        color="emerald"
                        suffix={`/${totalEmployees}`}
                        delay={80}
                    />
                    <StatCard
                        label="On Leave"
                        value={onLeaveToday}
                        icon={CalendarOff}
                        href="/admin/leave/calendar"
                        color="amber"
                        delay={120}
                    />
                    <StatCard
                        label="Late"
                        value={lateToday}
                        icon={Clock}
                        href="/admin/attendance"
                        color={lateToday > 1 ? 'error' : 'secondary'}
                        delay={160}
                    />
                    <StatCard
                        label="Absent"
                        value={absentToday}
                        icon={Timer}
                        href="/admin/attendance"
                        color={absentToday > 0 ? 'error' : 'emerald'}
                        delay={200}
                    />
                    <StatCard
                        label="Attendance Rate"
                        value={attendanceRate}
                        icon={Percent}
                        href="/admin/attendance"
                        color={
                            attendanceRate >= 80
                                ? 'emerald'
                                : attendanceRate >= 60
                                    ? 'amber'
                                    : 'error'
                        }
                        suffix="%"
                        decimals={1}
                        delay={240}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <DomainScore
                        label="Attendance Health"
                        score={Math.round(attendanceRate)}
                        max={100}
                        icon={HeartPulse}
                    />
                    <DomainScore
                        label="Check-in Compliance"
                        score={checkedInToday}
                        max={totalEmployees}
                        icon={Target}
                    />
                    <DomainScore
                        label="Leave Utilization"
                        score={onLeaveToday}
                        max={Math.max(totalEmployees, 1)}
                        icon={CalendarOff}
                    />
                </div>
            </section>

            {/* ─── PRODUCTION DOMAIN ─── */}
            <section className="morph-fade-in morph-delay-3">
                <SectionHeader
                    icon={FolderKanban}
                    title="Production & Tasks"
                    subtitle={`${completedTasks} completed \u00b7 ${pendingTasks + inProgressTasks} active \u00b7 ${overdueTasks} overdue`}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <StatCard
                        label="Active Projects"
                        value={activeProjectCount}
                        icon={FolderKanban}
                        href="/admin/projects"
                        color="primary"
                        subtitle={`${projectHealthPercent}% healthy`}
                        delay={40}
                    />
                    <StatCard
                        label="Total Tasks"
                        value={totalTasks}
                        icon={CheckSquare}
                        href="/admin/tasks"
                        color="secondary"
                        delay={80}
                    />
                    <StatCard
                        label="In Progress"
                        value={inProgressTasks}
                        icon={Activity}
                        href="/admin/tasks"
                        color="primary"
                        delay={120}
                    />
                    <StatCard
                        label="Completed"
                        value={completedTasks}
                        icon={CheckSquare}
                        href="/admin/tasks"
                        color="emerald"
                        delay={160}
                    />
                    <StatCard
                        label="Overdue"
                        value={overdueTasks}
                        icon={AlertTriangle}
                        href="/admin/tasks"
                        color={overdueTasks > 0 ? 'error' : 'emerald'}
                        delay={200}
                    />
                    <StatCard
                        label="On-Time Rate"
                        value={onTimeCompletion}
                        icon={Percent}
                        href="/admin/tasks"
                        color={
                            onTimeCompletion >= 80
                                ? 'emerald'
                                : onTimeCompletion >= 60
                                    ? 'amber'
                                    : 'error'
                        }
                        suffix="%"
                        decimals={1}
                        delay={240}
                        trend={{
                            direction:
                                completionTrend > 0
                                    ? 'up'
                                    : completionTrend < 0
                                        ? 'down'
                                        : 'neutral',
                            text: `${Math.abs(completionTrend).toFixed(1)}%`,
                        }}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <DomainScore
                        label="Task Completion (This Month)"
                        score={completedTasksThisMonth}
                        max={Math.max(tasksThisMonth, 1)}
                        icon={Target}
                    />
                    <DomainScore
                        label="Project Health"
                        score={projectHealthPercent}
                        max={100}
                        icon={BarChart3}
                    />
                    <DomainScore
                        label="On-Time Delivery"
                        score={Math.round(onTimeCompletion)}
                        max={100}
                        icon={Gauge}
                    />
                </div>
            </section>

            {/* ─── FINANCE DOMAIN ─── */}
            <section className="morph-fade-in morph-delay-4">
                <SectionHeader
                    icon={DollarSign}
                    title="Finance & Operations"
                    subtitle={`Receivable: ${totalReceivable.toLocaleString()} \u00b7 Expenses: ${totalExpenses.toLocaleString()}`}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <StatCard
                        label="Draft Invoices"
                        value={draftInvoices}
                        icon={Receipt}
                        href="/admin/invoices"
                        color="secondary"
                        delay={40}
                    />
                    <StatCard
                        label="Active (Sent)"
                        value={activeInvoices}
                        icon={FileText}
                        href="/admin/invoices"
                        color="amber"
                        delay={80}
                    />
                    <StatCard
                        label="Overdue"
                        value={overdueInvoices}
                        icon={AlertTriangle}
                        href="/admin/invoices"
                        color={overdueInvoices > 0 ? 'error' : 'emerald'}
                        delay={120}
                    />
                    <StatCard
                        label="Paid"
                        value={paidInvoices}
                        icon={CheckSquare}
                        href="/admin/invoices"
                        color="emerald"
                        delay={160}
                    />
                    <StatCard
                        label="Revenue"
                        value={revenueThisMonth}
                        icon={TrendingUp}
                        href="/admin/invoices"
                        color={revenueThisMonth >= revenueLastMonth ? 'emerald' : 'amber'}
                        delay={200}
                        trend={{
                            direction:
                                revenueThisMonth >= revenueLastMonth ? 'up' : 'down',
                            text: `${Math.abs(revenueThisMonth - revenueLastMonth).toLocaleString()}`,
                        }}
                    />
                    <StatCard
                        label="Budget Used"
                        value={budgetUtilization}
                        icon={Percent}
                        href="/admin/expenses"
                        color={
                            budgetUtilization <= 70
                                ? 'emerald'
                                : budgetUtilization <= 85
                                    ? 'amber'
                                    : 'error'
                        }
                        suffix="%"
                        decimals={1}
                        delay={240}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <DomainScore
                        label="Collection Rate (This Month)"
                        score={monthlyInvoicesPaid}
                        max={Math.max(monthlyInvoicesTotal, 1)}
                        icon={DollarSign}
                    />
                    <DomainScore
                        label="Budget Discipline"
                        score={100 - Math.min(budgetUtilization, 100)}
                        max={100}
                        icon={Percent}
                    />
                    <DomainScore
                        label="Pending Approvals"
                        score={pendingApprovals}
                        max={Math.max(pendingApprovals, 5)}
                        icon={AlertTriangle}
                    />
                </div>
            </section>

            {/* ─── ASSETS DOMAIN ─── */}
            <section className="morph-fade-in morph-delay-5">
                <SectionHeader
                    icon={Camera}
                    title="Equipment & Resources"
                    subtitle={`${equipmentAvailable} available \u00b7 ${equipmentCheckedOut} checked out \u00b7 ${equipmentInMaintenance} in maintenance`}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        label="Available"
                        value={equipmentAvailable}
                        icon={Camera}
                        href="/admin/equipment"
                        color="emerald"
                        delay={40}
                    />
                    <StatCard
                        label="Checked Out"
                        value={equipmentCheckedOut}
                        icon={Briefcase}
                        href="/admin/equipment/checkout"
                        color="amber"
                        delay={80}
                    />
                    <StatCard
                        label="In Maintenance"
                        value={equipmentInMaintenance}
                        icon={Timer}
                        href="/admin/equipment/maintenance"
                        color={equipmentInMaintenance > 0 ? 'error' : 'secondary'}
                        delay={120}
                    />
                    <StatCard
                        label="Total Clients"
                        value={clientCount}
                        icon={UserSquare2}
                        href="/admin/clients"
                        color="tertiary"
                        subtitle={`${totalMeetings} meetings`}
                        delay={160}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <DomainScore
                        label="Equipment Availability"
                        score={equipmentAvailable}
                        max={Math.max(
                            equipmentAvailable +
                            equipmentCheckedOut +
                            equipmentInMaintenance,
                            1,
                        )}
                        icon={Camera}
                    />
                    <DomainScore
                        label="Client Engagements (This Month)"
                        score={meetingsThisMonth}
                        max={Math.max(meetingsThisMonth, 10)}
                        icon={UserSquare2}
                    />
                </div>
            </section>

            {/* ─── BOTTOM ROW ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Attendance Panel */}
                    <div className="rounded-2xl bg-surface-container-lowest elevation-1 ring-1 ring-outline-variant/40 overflow-hidden card-morph morph-fade-in morph-delay-6">
                        <div className="px-5 pt-5">
                            <SectionHeader
                                icon={ClipboardList}
                                title="Today's Attendance"
                                subtitle={
                                    todayAttendance.length > 0
                                        ? `${todayAttendance.length} entries recorded`
                                        : 'No entries yet'
                                }
                                action={
                                    <Link
                                        href="/admin/attendance"
                                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                    >
                                        View all
                                    </Link>
                                }
                            />
                        </div>
                        <div className="px-5 pb-5">
                            {todayAttendance && todayAttendance.length > 0 ? (
                                <div className="divide-y divide-outline-variant/20 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {todayAttendance.map((entry, i) => (
                                        <div
                                            key={entry.id}
                                            className={cn(
                                                'flex items-center justify-between py-2.5',
                                                i === 0 && 'pt-0',
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-primary-container text-primary flex items-center justify-center text-xs font-bold shadow-sm">
                                                    {entry.profiles?.full_name
                                                        ?.charAt(0)
                                                        ?.toUpperCase() || '?'}
                                                </div>
                                                <span className="text-sm font-medium text-foreground">
                                                    {entry.profiles?.full_name || 'Unknown'}
                                                </span>
                                            </div>
                                            <span className="text-xs tabular-nums text-on-surface-variant">
                                                {new Date(entry.created_at).toLocaleTimeString(
                                                    'en-US',
                                                    { hour: '2-digit', minute: '2-digit' },
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mb-3">
                                        <Clock className="w-6 h-6 text-on-surface-variant" />
                                    </div>
                                    <p className="text-sm text-on-surface-variant font-medium">
                                        No attendance records for today.
                                    </p>
                                    <p className="text-xs text-outline mt-1">
                                        Check back once employees start checking in.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Tasks Panel */}
                    <div className="rounded-2xl bg-surface-container-lowest elevation-1 ring-1 ring-outline-variant/40 overflow-hidden card-morph morph-fade-in morph-delay-7">
                        <div className="px-5 pt-5">
                            <SectionHeader
                                icon={Activity}
                                title="Recent Tasks"
                                subtitle={
                                    recentTasks.length > 0
                                        ? 'Latest assignments across projects'
                                        : 'No recent tasks'
                                }
                                action={
                                    <Link
                                        href="/admin/tasks"
                                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                    >
                                        View all
                                    </Link>
                                }
                            />
                        </div>
                        <div className="px-5 pb-5">
                            {recentTasks && recentTasks.length > 0 ? (
                                <div className="divide-y divide-outline-variant/20">
                                    {recentTasks.map((task, i) => {
                                        const projectName = task.projects?.title || 'Project'
                                        const match = task.title.match(
                                            /^E5_Task_(\d+)\s*-\s*(.*)/,
                                        )
                                        const displayTitle = match
                                            ? `${projectName} \u2014 ${match[2]}`
                                            : `${projectName} \u2014 ${task.title}`
                                        return (
                                            <div
                                                key={task.id}
                                                className={cn(
                                                    'flex items-center justify-between gap-3 py-2.5',
                                                    i === 0 && 'pt-0',
                                                )}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={cn(
                                                                'w-1.5 h-1.5 rounded-full shrink-0',
                                                                task.status === 'completed'
                                                                    ? 'bg-tertiary'
                                                                    : task.status === 'in_progress'
                                                                        ? 'bg-primary'
                                                                        : 'bg-outline',
                                                            )}
                                                        />
                                                        <span className="text-sm font-medium text-foreground truncate">
                                                            {displayTitle}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-on-surface-variant mt-0.5 ml-3.5 truncate">
                                                        {task.profiles?.full_name || 'Unassigned'}{' '}
                                                        &middot; {projectName}
                                                    </div>
                                                </div>
                                                <StatusBadge status={task.status} />
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mb-3">
                                        <CheckSquare className="w-6 h-6 text-on-surface-variant" />
                                    </div>
                                    <p className="text-sm text-on-surface-variant font-medium">
                                        No recent tasks found.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="rounded-2xl bg-surface-container-lowest elevation-1 ring-1 ring-outline-variant/40 p-5 card-morph morph-fade-in morph-delay-6">
                        <SectionHeader
                            icon={Sparkles}
                            title="Quick Actions"
                            subtitle="Frequently used tools"
                        />
                        <div className="space-y-2 mt-4">
                            <QuickAction
                                label="Record Attendance"
                                href="/admin/attendance"
                                icon={CalendarCheck}
                                color="primary"
                            />
                            <QuickAction
                                label="Create Invoice"
                                href="/admin/invoices/new"
                                icon={DollarSign}
                                color="tertiary"
                            />
                            <QuickAction
                                label="Assign Task"
                                href="/admin/tasks"
                                icon={Briefcase}
                                color="secondary"
                            />
                            <QuickAction
                                label="Add Employee"
                                href="/admin/employees"
                                icon={Users}
                                color="primary"
                            />
                        </div>
                    </div>

                    {/* Ecosystem Health */}
                    <div className="rounded-2xl bg-gradient-to-br from-primary-container to-surface-container-lowest elevation-1 ring-1 ring-primary/20 p-5 overflow-hidden relative card-morph morph-fade-in morph-delay-7">
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-primary/5 blur-3xl morph-glow-pulse" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-3 shadow-sm">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-on-primary-container text-base tracking-tight">
                                Ecosystem Summary
                            </h3>
                            <div className="mt-4 space-y-3">
                                {[
                                    {
                                        label: 'People',
                                        value: `${checkedInToday}/${totalEmployees} present`,
                                        pct:
                                            totalEmployees > 0
                                                ? Math.round(
                                                    (checkedInToday / totalEmployees) * 100,
                                                )
                                                : 0,
                                        clr: 'primary' as const,
                                    },
                                    {
                                        label: 'Tasks',
                                        value: `${completedTasks} done of ${totalTasks}`,
                                        pct:
                                            totalTasks > 0
                                                ? Math.round((completedTasks / totalTasks) * 100)
                                                : 0,
                                        clr: 'tertiary' as const,
                                    },
                                    {
                                        label: 'Revenue',
                                        value: `${revenueThisMonth.toLocaleString()} this month`,
                                        pct:
                                            revenueLastMonth > 0
                                                ? Math.min(
                                                    Math.round(
                                                        (revenueThisMonth / revenueLastMonth) * 100,
                                                    ),
                                                    100,
                                                )
                                                : 0,
                                        clr: 'emerald' as const,
                                    },
                                    {
                                        label: 'Equipment',
                                        value: `${equipmentAvailable} units available`,
                                        pct: Math.round(
                                            (equipmentAvailable /
                                                Math.max(
                                                    equipmentAvailable +
                                                    equipmentCheckedOut +
                                                    equipmentInMaintenance,
                                                    1,
                                                )) *
                                            100,
                                        ),
                                        clr: 'amber' as const,
                                    },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-on-primary-container/70">
                                                {item.label}
                                            </span>
                                            <span className="font-semibold text-on-primary-container text-[11px] tabular-nums">
                                                {item.value}
                                            </span>
                                        </div>
                                        <MiniProgress
                                            value={item.pct}
                                            max={100}
                                            color={item.clr}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-between">
                                <span className="text-[10px] text-on-primary-container/60 font-medium">
                                    System health score
                                </span>
                                <span
                                    className={cn(
                                        'text-xs font-medium flex items-center gap-1',
                                        healthScore >= 80
                                            ? 'text-m3-success'
                                            : healthScore >= 60
                                                ? 'text-m3-warning'
                                                : 'text-m3-error',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'w-1.5 h-1.5 rounded-full animate-pulse',
                                            healthScore >= 80
                                                ? 'bg-m3-success'
                                                : healthScore >= 60
                                                    ? 'bg-m3-warning'
                                                    : 'bg-m3-error',
                                        )}
                                    />
                                    {healthScore >= 80
                                        ? 'Healthy'
                                        : healthScore >= 60
                                            ? 'Needs attention'
                                            : 'Critical'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
