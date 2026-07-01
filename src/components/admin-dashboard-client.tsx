'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
    Users, UserSquare2, FolderKanban, CheckSquare, ClipboardList,
    ArrowRight, TrendingUp, TrendingDown, Clock, CalendarCheck,
    Briefcase, DollarSign, Activity, Sparkles,
    AlertTriangle, Timer, CalendarOff, Receipt, Wallet, FileText,
    Camera, Target, Percent, BarChart3, HeartPulse, Gauge, Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ──────────────────────────────────────
   Types
   ────────────────────────────────────── */
interface TaskSummary {
    id: string
    title: string
    status: string
    created_at: string
    profiles: { full_name: string } | null
    projects: { title: string; clients: { company_name: string } | null } | null
}

interface AttendanceEntry {
    id: string
    created_at: string
    profiles: { full_name: string } | null
}

interface HealthMetrics {
    employeeCount: number; clientCount: number; activeProjectCount: number; taskCount: number
    recentTasks: TaskSummary[]; todayAttendance: AttendanceEntry[]
    totalEmployees: number; checkedInToday: number; onLeaveToday: number; absentToday: number; lateToday: number
    attendanceRate: number; pendingTasks: number; inProgressTasks: number; overdueTasks: number; completedTasks: number
    onTimeCompletion: number; activeInvoices: number; overdueInvoices: number; draftInvoices: number; paidInvoices: number
    totalReceivable: number; totalExpenses: number; budgetUtilization: number; pendingApprovals: number; totalLeaveRequests: number
    employeeCountChange: number; attendanceTrend: number; completionTrend: number
    revenueThisMonth: number; revenueLastMonth: number; activeClients: number; projectHealthPercent: number
    equipmentCheckedOut: number; equipmentInMaintenance: number; equipmentAvailable: number; totalMeetings: number; month: string
    // Monthly-windowed domain score data
    completedTasksThisMonth: number; tasksThisMonth: number
    monthlyInvoicesPaid: number; monthlyInvoicesTotal: number
    meetingsThisMonth: number
}

/* ──────────────────────────────────────
   Animated Counter
   ────────────────────────────────────── */
function AnimatedNumber({ value = 0, suffix = '', decimals = 0 }: { value?: number; suffix?: string; decimals?: number }) {
    const [display, setDisplay] = useState(0)
    const hasAnimated = useRef(false)

    useEffect(() => {
        if (hasAnimated.current) { setDisplay(value); return }
        hasAnimated.current = true
        const duration = 1500
        const steps = 60
        const increment = value / steps
        let current = 0
        let step = 0
        const timer = setInterval(() => {
            step++
            current = Math.min(Math.round(increment * step * Math.pow(10, decimals)) / Math.pow(10, decimals), value)
            setDisplay(current)
            if (step >= steps) { setDisplay(value); clearInterval(timer) }
        }, duration / steps)
        return () => clearInterval(timer)
    }, [value, decimals])

    const formatted = decimals > 0 
        ? Number(display).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) 
        : Math.round(display).toLocaleString()

    return <span className="tabular-nums">{formatted}{suffix}</span>
}

/* ──────────────────────────────────────
   Health Score Ring
   ────────────────────────────────────── */
function HealthScore({ score }: { score: number }) {
    const radius = 36
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (Math.min(score, 100) / 100) * circumference

    const color = score >= 80 ? 'stroke-emerald-500' :
        score >= 60 ? 'stroke-amber-500' :
            score >= 40 ? 'stroke-orange-500' : 'stroke-red-500'
    const labelColor = score >= 80 ? 'text-emerald-500' :
        score >= 60 ? 'text-amber-500' :
            score >= 40 ? 'text-orange-500' : 'text-red-500'
    const bgColor = score >= 80 ? 'text-emerald-500/20' :
        score >= 60 ? 'text-amber-500/20' :
            score >= 40 ? 'text-orange-500/20' : 'text-red-500/20'

    return (
        <div className="flex flex-col items-center morph-scale-in">
            <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className={bgColor} />
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="5"
                        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                        className={cn(color, 'transition-all duration-1000 ease-out')} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn('text-xl font-bold', labelColor)}>{Math.round(score)}%</span>
                </div>
            </div>
            <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider mt-1">Health</span>
        </div>
    )
}

/* ──────────────────────────────────────
   Stat Card
   ────────────────────────────────────── */
interface StatCardProps {
    label: string; value: number; icon: any; href: string
    color: 'primary' | 'tertiary' | 'secondary' | 'error' | 'emerald' | 'amber'
    trend?: { direction: 'up' | 'down' | 'neutral'; text: string }
    suffix?: string; decimals?: number; subtitle?: string; delay?: number
}

const colorMap = {
    primary: { bg: 'bg-primary-container', text: 'text-primary', badge: 'bg-primary/10 text-primary', ring: 'hover:ring-primary/30' },
    tertiary: { bg: 'bg-tertiary-container', text: 'text-tertiary', badge: 'bg-tertiary/10 text-tertiary', ring: 'hover:ring-tertiary/30' },
    secondary: { bg: 'bg-secondary-container', text: 'text-secondary', badge: 'bg-secondary/10 text-secondary', ring: 'hover:ring-secondary/30' },
    error: { bg: 'bg-error-container', text: 'text-destructive', badge: 'bg-destructive/10 text-destructive', ring: 'hover:ring-destructive/30' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-500', ring: 'hover:ring-emerald-500/30' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500/10 text-amber-500', ring: 'hover:ring-amber-500/30' },
}

function StatCard({ label, value, icon: Icon, href, color, trend, suffix = '', decimals = 0, subtitle, delay = 0 }: StatCardProps) {
    const c = colorMap[color]
    return (
        <Link href={href} className="group block morph-fade-in" style={{ animationDelay: `${delay}ms` }}>
            <div className={cn(
                'relative overflow-hidden rounded-2xl bg-surface-container-lowest p-4 card-morph',
                'ring-1 ring-outline-variant/40', c.ring
            )}>
                <div className="flex items-start justify-between mb-2">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', c.bg)}>
                        <Icon className={cn('w-4.5 h-4.5 icon-morph', c.text)} />
                    </div>
                    {trend && (
                        <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full', c.badge)}>
                            {trend.direction === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> :
                                trend.direction === 'down' ? <TrendingDown className="w-2.5 h-2.5" /> :
                                    <Minus className="w-2.5 h-2.5" />}
                            {trend.text}
                        </span>
                    )}
                </div>
                <div className="text-2xl font-bold text-foreground tracking-tight">
                    <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />
                </div>
                <div className="text-xs text-on-surface-variant mt-0.5 font-medium truncate">{label}</div>
                {subtitle && <div className="text-[10px] text-outline mt-0.5">{subtitle}</div>}
                <div className="mt-2 flex items-center gap-1 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className={c.text}>View details</span>
                    <ArrowRight className={cn('w-2.5 h-2.5', c.text)} />
                </div>
            </div>
        </Link>
    )
}

/* ──────────────────────────────────────
   Status Badge
   ────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        completed: { label: 'Completed', className: 'bg-tertiary-container text-on-tertiary-container' },
        in_progress: { label: 'In Progress', className: 'bg-primary-container text-on-primary-container' },
        todo: { label: 'To Do', className: 'bg-surface-container-high text-on-surface-variant' },
    }
    const s = config[status] || { label: status.replace('_', ' '), className: 'bg-surface-container-high text-on-surface-variant' }
    return (
        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap capitalize', s.className)}>
            {s.label}
        </span>
    )
}

/* ──────────────────────────────────────
   Section Header
   ────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, subtitle, action }: { icon: any; title: string; subtitle?: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-container text-primary flex items-center justify-center shadow-sm">
                    <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground text-sm tracking-tight">{title}</h3>
                    {subtitle && <p className="text-xs text-on-surface-variant">{subtitle}</p>}
                </div>
            </div>
            {action}
        </div>
    )
}

/* ──────────────────────────────────────
   Mini Progress Bar
   ────────────────────────────────────── */
function MiniProgress({ value, max, color = 'primary' }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    return (
        <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div className={cn(
                'h-full rounded-full transition-all duration-700',
                color === 'primary' ? 'bg-primary' : color === 'emerald' ? 'bg-emerald-500' :
                    color === 'amber' ? 'bg-amber-500' : color === 'red' ? 'bg-red-500' :
                        color === 'tertiary' ? 'bg-tertiary' : 'bg-primary'
            )} style={{ width: `${pct}%` }} />
        </div>
    )
}

/* ──────────────────────────────────────
   Quick Action Card
   ────────────────────────────────────── */
function QuickAction({ label, href, icon: Icon, color }: { label: string; href: string; icon: any; color: 'primary' | 'tertiary' | 'secondary' }) {
    const c = colorMap[color]
    return (
        <Link href={href} className={cn(
            'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 card-morph',
            'bg-surface-container-high hover:bg-primary-container',
            'ring-1 ring-outline-variant/30 hover:ring-primary/30'
        )}>
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', c.bg)}>
                <Icon className={cn('w-4.5 h-4.5 icon-morph', c.text)} />
            </div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
            <ArrowRight className={cn('w-4 h-4 ml-auto text-on-surface-variant group-hover:text-primary transition-colors')} />
        </Link>
    )
}

/* ──────────────────────────────────────
   Domain Score Block
   ────────────────────────────────────── */
function DomainScore({ label, score = 0, max = 0, icon: Icon }: { label: string; score?: number; max?: number; icon: any }) {
    const pct = max > 0 ? Math.min(Math.round((score / max) * 100), 100) : 0
    const color = pct >= 80 ? 'emerald' : pct >= 60 ? 'amber' : 'red'
    return (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-high card-morph">
            <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500' :
                    color === 'amber' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-500' :
                        'bg-red-50 dark:bg-red-950/30 text-red-500'
            )}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground truncate">{label}</span>
                    <span className={cn('text-xs font-bold', color === 'emerald' ? 'text-emerald-500' : color === 'amber' ? 'text-amber-500' : 'text-red-500')}>
                        {max > 0 ? `${score}/${max}` : 'N/A'}
                    </span>
                </div>
                <MiniProgress value={score} max={max} color={color} />
            </div>
        </div>
    )
}

/* ──────────────────────────────────────
   Main Dashboard Client Component
   ────────────────────────────────────── */
export function AdminDashboardClient({ data }: { data: HealthMetrics }) {
    const {
        totalEmployees, checkedInToday, onLeaveToday, absentToday, lateToday,
        attendanceRate, pendingTasks, inProgressTasks, overdueTasks, completedTasks,
        onTimeCompletion, activeInvoices, overdueInvoices, draftInvoices, paidInvoices,
        totalReceivable, totalExpenses, budgetUtilization, pendingApprovals, totalLeaveRequests,
        employeeCountChange, completionTrend, revenueThisMonth, revenueLastMonth,
        activeClients, projectHealthPercent, equipmentCheckedOut, equipmentInMaintenance,
        equipmentAvailable, clientCount, totalMeetings, month, activeProjectCount, recentTasks, todayAttendance,
        completedTasksThisMonth, tasksThisMonth,
        monthlyInvoicesPaid, monthlyInvoicesTotal,
        meetingsThisMonth,
    } = data

    const attendanceWeight = 0.25; const taskWeight = 0.25; const financeWeight = 0.20; const projectWeight = 0.15; const equipmentWeight = 0.15
    const taskHealth = completedTasks + inProgressTasks > 0 ? Math.round((onTimeCompletion / 100) * 100) : 50
    const financeHealth = totalExpenses > 0 ? Math.round((1 - Math.min(budgetUtilization / 100, 1)) * 100) : 70
    const equipHealth = equipmentAvailable + equipmentCheckedOut + equipmentInMaintenance > 0
        ? Math.round((equipmentAvailable / (equipmentAvailable + equipmentCheckedOut + equipmentInMaintenance)) * 100) : 80
    const healthScore = Math.round(attendanceRate * attendanceWeight + taskHealth * taskWeight + financeHealth * financeWeight + projectHealthPercent * projectWeight + equipHealth * equipmentWeight)

    const employeeTrend = employeeCountChange > 0 ? { direction: 'up' as const, text: `+${employeeCountChange}` }
        : employeeCountChange < 0 ? { direction: 'down' as const, text: `${employeeCountChange}` } : undefined

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
                            {month} ecosystem analysis &mdash; {totalEmployees} employees, {activeProjectCount} active projects, {activeClients} active clients.
                        </p>
                    </div>
                    <HealthScore score={healthScore} />
                </div>
            </section>

            {/* ─── PEOPLE DOMAIN ─── */}
            <section className="morph-fade-in morph-delay-2">
                <SectionHeader
                    icon={Users} title="People & Attendance"
                    subtitle={`${checkedInToday} checked in today \u00b7 ${attendanceRate}% attendance rate`}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <StatCard label="Total Employees" value={totalEmployees} icon={Users} href="/admin/employees" color="primary" trend={employeeTrend} delay={40} />
                    <StatCard label="Checked In" value={checkedInToday} icon={CalendarCheck} href="/admin/attendance" color="emerald" suffix={`/${totalEmployees}`} delay={80} />
                    <StatCard label="On Leave" value={onLeaveToday} icon={CalendarOff} href="/admin/leave/calendar" color="amber" delay={120} />
                    <StatCard label="Late" value={lateToday} icon={Clock} href="/admin/attendance" color={lateToday > 1 ? 'error' : 'secondary'} delay={160} />
                    <StatCard label="Absent" value={absentToday} icon={Timer} href="/admin/attendance" color={absentToday > 0 ? 'error' : 'emerald'} delay={200} />
                    <StatCard label="Attendance Rate" value={attendanceRate} icon={Percent} href="/admin/attendance"
                        color={attendanceRate >= 80 ? 'emerald' : attendanceRate >= 60 ? 'amber' : 'error'} suffix="%" decimals={1} delay={240} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <DomainScore label="Attendance Health" score={Math.round(attendanceRate)} max={100} icon={HeartPulse} />
                    <DomainScore label="Check-in Compliance" score={checkedInToday} max={totalEmployees} icon={Target} />
                    <DomainScore label="Leave Utilization" score={onLeaveToday} max={Math.max(totalEmployees, 1)} icon={CalendarOff} />
                </div>
            </section>

            {/* ─── PRODUCTION DOMAIN ─── */}
            <section className="morph-fade-in morph-delay-3">
                <SectionHeader icon={FolderKanban} title="Production & Tasks"
                    subtitle={`${completedTasks} completed \u00b7 ${pendingTasks + inProgressTasks} active \u00b7 ${overdueTasks} overdue`} />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <StatCard label="Active Projects" value={activeProjectCount} icon={FolderKanban} href="/admin/projects" color="primary" subtitle={`${projectHealthPercent}% healthy`} delay={40} />
                    <StatCard label="Total Tasks" value={totalTasks} icon={CheckSquare} href="/admin/tasks" color="secondary" delay={80} />
                    <StatCard label="In Progress" value={inProgressTasks} icon={Activity} href="/admin/tasks" color="primary" delay={120} />
                    <StatCard label="Completed" value={completedTasks} icon={CheckSquare} href="/admin/tasks" color="emerald" delay={160} />
                    <StatCard label="Overdue" value={overdueTasks} icon={AlertTriangle} href="/admin/tasks" color={overdueTasks > 0 ? 'error' : 'emerald'} delay={200} />
                    <StatCard label="On-Time Rate" value={onTimeCompletion} icon={Percent} href="/admin/tasks"
                        color={onTimeCompletion >= 80 ? 'emerald' : onTimeCompletion >= 60 ? 'amber' : 'error'} suffix="%" decimals={1} delay={240}
                        trend={{ direction: completionTrend > 0 ? 'up' : completionTrend < 0 ? 'down' : 'neutral', text: `${Math.abs(completionTrend).toFixed(1)}%` }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <DomainScore label="Task Completion (This Month)" score={completedTasksThisMonth} max={Math.max(tasksThisMonth, 1)} icon={Target} />
                    <DomainScore label="Project Health" score={projectHealthPercent} max={100} icon={BarChart3} />
                    <DomainScore label="On-Time Delivery" score={Math.round(onTimeCompletion)} max={100} icon={Gauge} />
                </div>
            </section>

            {/* ─── FINANCE DOMAIN ─── */}
            <section className="morph-fade-in morph-delay-4">
                <SectionHeader icon={DollarSign} title="Finance & Operations"
                    subtitle={`Receivable: ${totalReceivable.toLocaleString()} \u00b7 Expenses: ${totalExpenses.toLocaleString()}`} />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <StatCard label="Draft Invoices" value={draftInvoices} icon={Receipt} href="/admin/invoices" color="secondary" delay={40} />
                    <StatCard label="Active (Sent)" value={activeInvoices} icon={FileText} href="/admin/invoices" color="amber" delay={80} />
                    <StatCard label="Overdue" value={overdueInvoices} icon={AlertTriangle} href="/admin/invoices" color={overdueInvoices > 0 ? 'error' : 'emerald'} delay={120} />
                    <StatCard label="Paid" value={paidInvoices} icon={CheckSquare} href="/admin/invoices" color="emerald" delay={160} />
                    <StatCard label="Revenue" value={revenueThisMonth} icon={TrendingUp} href="/admin/invoices"
                        color={revenueThisMonth >= revenueLastMonth ? 'emerald' : 'amber'} delay={200}
                        trend={{ direction: revenueThisMonth >= revenueLastMonth ? 'up' : 'down', text: `${Math.abs(revenueThisMonth - revenueLastMonth).toLocaleString()}` }} />
                    <StatCard label="Budget Used" value={budgetUtilization} icon={Percent} href="/admin/expenses"
                        color={budgetUtilization <= 70 ? 'emerald' : budgetUtilization <= 85 ? 'amber' : 'error'} suffix="%" decimals={1} delay={240} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <DomainScore label="Collection Rate (This Month)" score={monthlyInvoicesPaid} max={Math.max(monthlyInvoicesTotal, 1)} icon={DollarSign} />
                    <DomainScore label="Budget Discipline" score={100 - Math.min(budgetUtilization, 100)} max={100} icon={Percent} />
                    <DomainScore label="Pending Approvals" score={pendingApprovals} max={Math.max(pendingApprovals, 5)} icon={AlertTriangle} />
                </div>
            </section>

            {/* ─── ASSETS DOMAIN ─── */}
            <section className="morph-fade-in morph-delay-5">
                <SectionHeader icon={Camera} title="Equipment & Resources"
                    subtitle={`${equipmentAvailable} available \u00b7 ${equipmentCheckedOut} checked out \u00b7 ${equipmentInMaintenance} in maintenance`} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Available" value={equipmentAvailable} icon={Camera} href="/admin/equipment" color="emerald" delay={40} />
                    <StatCard label="Checked Out" value={equipmentCheckedOut} icon={Briefcase} href="/admin/equipment/checkout" color="amber" delay={80} />
                    <StatCard label="In Maintenance" value={equipmentInMaintenance} icon={Timer} href="/admin/equipment/maintenance" color={equipmentInMaintenance > 0 ? 'error' : 'secondary'} delay={120} />
                    <StatCard label="Total Clients" value={clientCount} icon={UserSquare2} href="/admin/clients" color="tertiary" subtitle={`${totalMeetings} meetings`} delay={160} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <DomainScore label="Equipment Availability" score={equipmentAvailable} max={Math.max(equipmentAvailable + equipmentCheckedOut + equipmentInMaintenance, 1)} icon={Camera} />
                    <DomainScore label="Client Engagements (This Month)" score={meetingsThisMonth} max={Math.max(meetingsThisMonth, 10)} icon={UserSquare2} />
                </div>
            </section>

            {/* ─── BOTTOM ROW ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">

                    {/* Attendance Panel */}
                    <div className="rounded-2xl bg-surface-container-lowest elevation-1 ring-1 ring-outline-variant/40 overflow-hidden card-morph morph-fade-in morph-delay-6">
                        <div className="px-5 pt-5">
                            <SectionHeader icon={ClipboardList} title="Today's Attendance"
                                subtitle={todayAttendance.length > 0 ? `${todayAttendance.length} entries recorded` : 'No entries yet'}
                                action={<Link href="/admin/attendance" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">View all</Link>} />
                        </div>
                        <div className="px-5 pb-5">
                            {todayAttendance && todayAttendance.length > 0 ? (
                                <div className="divide-y divide-outline-variant/20 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {todayAttendance.map((entry, i) => (
                                        <div key={entry.id} className={cn('flex items-center justify-between py-2.5', i === 0 && 'pt-0')}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-primary-container text-primary flex items-center justify-center text-xs font-bold shadow-sm">
                                                    {entry.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <span className="text-sm font-medium text-foreground">{entry.profiles?.full_name || 'Unknown'}</span>
                                            </div>
                                            <span className="text-xs tabular-nums text-on-surface-variant">
                                                {new Date(entry.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mb-3">
                                        <Clock className="w-6 h-6 text-on-surface-variant" />
                                    </div>
                                    <p className="text-sm text-on-surface-variant font-medium">No attendance records for today.</p>
                                    <p className="text-xs text-outline mt-1">Check back once employees start checking in.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Tasks Panel */}
                    <div className="rounded-2xl bg-surface-container-lowest elevation-1 ring-1 ring-outline-variant/40 overflow-hidden card-morph morph-fade-in morph-delay-7">
                        <div className="px-5 pt-5">
                            <SectionHeader icon={Activity} title="Recent Tasks"
                                subtitle={recentTasks.length > 0 ? 'Latest assignments across projects' : 'No recent tasks'}
                                action={<Link href="/admin/tasks" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">View all</Link>} />
                        </div>
                        <div className="px-5 pb-5">
                            {recentTasks && recentTasks.length > 0 ? (
                                <div className="divide-y divide-outline-variant/20">
                                    {recentTasks.map((task, i) => {
                                        const projectName = task.projects?.title || 'Project'
                                        const match = task.title.match(/^E5_Task_(\d+)\s*-\s*(.*)/)
                                        const displayTitle = match ? `${projectName} \u2014 ${match[2]}` : `${projectName} \u2014 ${task.title}`
                                        return (
                                            <div key={task.id} className={cn('flex items-center justify-between gap-3 py-2.5', i === 0 && 'pt-0')}>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn('w-1.5 h-1.5 rounded-full shrink-0',
                                                            task.status === 'completed' ? 'bg-tertiary' : task.status === 'in_progress' ? 'bg-primary' : 'bg-outline')} />
                                                        <span className="text-sm font-medium text-foreground truncate">{displayTitle}</span>
                                                    </div>
                                                    <div className="text-xs text-on-surface-variant mt-0.5 ml-3.5 truncate">
                                                        {task.profiles?.full_name || 'Unassigned'} &middot; {projectName}
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
                                    <p className="text-sm text-on-surface-variant font-medium">No recent tasks found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">

                    {/* Quick Actions */}
                    <div className="rounded-2xl bg-surface-container-lowest elevation-1 ring-1 ring-outline-variant/40 p-5 card-morph morph-fade-in morph-delay-6">
                        <SectionHeader icon={Sparkles} title="Quick Actions" subtitle="Frequently used tools" />
                        <div className="space-y-2 mt-4">
                            <QuickAction label="Record Attendance" href="/admin/attendance" icon={CalendarCheck} color="primary" />
                            <QuickAction label="Create Invoice" href="/admin/invoices/new" icon={DollarSign} color="tertiary" />
                            <QuickAction label="Assign Task" href="/admin/tasks" icon={Briefcase} color="secondary" />
                            <QuickAction label="Add Employee" href="/admin/employees" icon={Users} color="primary" />
                        </div>
                    </div>

                    {/* Ecosystem Health */}
                    <div className="rounded-2xl bg-gradient-to-br from-primary-container to-surface-container-lowest elevation-1 ring-1 ring-primary/20 p-5 overflow-hidden relative card-morph morph-fade-in morph-delay-7">
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-primary/5 blur-3xl morph-glow-pulse" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-3 shadow-sm">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-on-primary-container text-base tracking-tight">Ecosystem Summary</h3>
                            <div className="mt-4 space-y-3">
                                {[
                                    { label: 'People', value: `${checkedInToday}/${totalEmployees} present`, pct: totalEmployees > 0 ? Math.round((checkedInToday / totalEmployees) * 100) : 0, clr: 'primary' },
                                    { label: 'Tasks', value: `${completedTasks} done of ${totalTasks}`, pct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0, clr: 'tertiary' },
                                    { label: 'Revenue', value: `${revenueThisMonth.toLocaleString()} this month`, pct: revenueLastMonth > 0 ? Math.min(Math.round((revenueThisMonth / revenueLastMonth) * 100), 100) : 0, clr: 'emerald' },
                                    { label: 'Equipment', value: `${equipmentAvailable} units available`, pct: Math.round((equipmentAvailable / Math.max(equipmentAvailable + equipmentCheckedOut + equipmentInMaintenance, 1)) * 100), clr: 'amber' },
                                ].map(item => (
                                    <div key={item.label}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-on-primary-container/70">{item.label}</span>
                                            <span className="font-semibold text-on-primary-container text-[11px] tabular-nums">{item.value}</span>
                                        </div>
                                        <MiniProgress value={item.pct} max={100} color={item.clr} />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-between">
                                <span className="text-[10px] text-on-primary-container/60 font-medium">System health score</span>
                                <span className={cn('text-xs font-medium flex items-center gap-1',
                                    healthScore >= 80 ? 'text-emerald-500' : healthScore >= 60 ? 'text-amber-500' : 'text-red-500')}>
                                    <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse',
                                        healthScore >= 80 ? 'bg-emerald-500' : healthScore >= 60 ? 'bg-amber-500' : 'bg-red-500')} />
                                    {healthScore >= 80 ? 'Healthy' : healthScore >= 60 ? 'Needs attention' : 'Critical'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
