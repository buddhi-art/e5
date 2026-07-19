'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
 Users, FolderKanban, DollarSign, Camera, TrendingUp, TrendingDown,
 CalendarCheck, Clock, CalendarOff, Timer, Receipt, Wallet, FileText,
 CheckSquare, AlertTriangle, Percent, BarChart3, Target, HeartPulse, Gauge,
 Activity, UserSquare2, Briefcase, Sparkles, Minus, ArrowUp,
 LayoutDashboard
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ──────────────────────────────────────
 Types
 ────────────────────────────────────── */
interface FounderData {
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

/* ──────────────────────────────────────
 Animated Counter
 ────────────────────────────────────── */
function AnimatedNumber({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
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

 return <span className="tabular-nums">{decimals > 0 ? display.toFixed(decimals) : display}{suffix}</span>
}

/* ──────────────────────────────────────
 Health Score Ring
 ────────────────────────────────────── */
function HealthScore({ score }: { score: number }) {
 const radius = 36
 const circumference = 2 * Math.PI * radius
 const offset = circumference - (Math.min(score, 100) / 100) * circumference

 const color = score >= 80 ? 'stroke-tertiary' :
 score >= 60 ? 'stroke-primary' :
 score >= 40 ? 'stroke-primary' : 'stroke-error'
 const labelColor = score >= 80 ? 'text-m3-success' :
 score >= 60 ? 'text-m3-warning' :
 score >= 40 ? 'text-primary' : 'text-m3-error'
 const bgColor = score >= 80 ? 'text-m3-success/20' :
 score >= 60 ? 'text-m3-warning/20' :
 score >= 40 ? 'text-primary/20' : 'text-m3-error/20'

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
 Stat Card (optional href — founder reads only)
 ────────────────────────────────────── */
interface StatCardProps {
 label: string; value: number; icon: any
 color: 'primary' | 'tertiary' | 'secondary' | 'error' | 'emerald' | 'amber'
 trend?: { direction: 'up' | 'down' | 'neutral'; text: string }
 suffix?: string; decimals?: number; subtitle?: string; delay?: number; href?: string
}

const colorMap = {
 primary: { bg: 'bg-primary-container', text: 'text-primary', badge: 'bg-primary/10 text-primary' },
 tertiary: { bg: 'bg-tertiary-container', text: 'text-tertiary', badge: 'bg-tertiary/10 text-tertiary' },
 secondary: { bg: 'bg-secondary-container', text: 'text-secondary', badge: 'bg-secondary/10 text-secondary' },
 error: { bg: 'bg-error-container', text: 'text-destructive', badge: 'bg-destructive/10 text-destructive' },
 emerald: { bg: 'bg-m3-success-subtle', text: 'text-m3-success', badge: 'bg-m3-success/10 text-m3-success' },
 amber: { bg: 'bg-m3-warning-subtle', text: 'text-m3-warning', badge: 'bg-m3-warning/10 text-m3-warning' },
}

function StatCard({ label, value, icon: Icon, color, trend, suffix = '', decimals = 0, subtitle, delay = 0, href }: StatCardProps) {
 const c = colorMap[color]
 const content = (
 <div className={cn(
 'relative overflow-hidden rounded-2xl bg-surface-container-lowest p-4 card-morph',
 'ring-1 ring-outline-variant/40',
 href && 'cursor-pointer transition-shadow hover:ring-primary/50'
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
 </div>
 )

 if (href) {
 return (
 <Link href={href} className="block morph-fade-in" style={{ animationDelay: `${delay}ms` }}>
 {content}
 </Link>
 )
 }

 return (
 <div className="block morph-fade-in" style={{ animationDelay: `${delay}ms` }}>
 {content}
 </div>
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
 const s = config[status] || { label: status.replace('_', ''), className: 'bg-surface-container-high text-on-surface-variant' }
 return (
 <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap capitalize', s.className)}>
 {s.label}
 </span>
 )
}

/* ──────────────────────────────────────
 Section Header
 ────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
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
 color === 'primary' ? 'bg-primary' : color === 'emerald' ? 'bg-m3-success' :
 color === 'amber' ? 'bg-m3-warning' : color === 'red' ? 'bg-m3-error' :
 color === 'tertiary' ? 'bg-tertiary' : 'bg-primary'
 )} style={{ width: `${pct}%` }} />
 </div>
 )
}

/* ──────────────────────────────────────
 Domain Score Block
 ────────────────────────────────────── */
function DomainScore({ label, score, max, icon: Icon }: { label: string; score: number; max: number; icon: any }) {
 const pct = max > 0 ? Math.min(Math.round((score / max) * 100), 100) : 0
 const color = pct >= 80 ? 'emerald' : pct >= 60 ? 'amber' : 'red'
 return (
 <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-high card-morph">
 <div className={cn(
 'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
 color === 'emerald' ? 'bg-m3-success-subtle text-m3-success' :
 color === 'amber' ? 'bg-m3-warning-subtle text-m3-warning' :
 'bg-m3-error-subtle text-m3-error'
 )}>
 <Icon className="w-4 h-4" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <span className="text-xs font-medium text-foreground truncate">{label}</span>
 <span className={cn('text-xs font-bold', color === 'emerald' ? 'text-m3-success' : color === 'amber' ? 'text-m3-warning' : 'text-m3-error')}>
 {score}/{max}
 </span>
 </div>
 <MiniProgress value={score} max={max} color={color} />
 </div>
 </div>
 )
}

/* ──────────────────────────────────────
 Main Founder Dashboard Component
 ────────────────────────────────────── */
export function FounderDashboardClient({ data }: { data: FounderData }) {
 const {
 totalEmployees, checkedInToday, onLeaveToday, absentToday, lateToday,
 attendanceRate, activeProjects, completedProjects, projectHealthPercent,
 pendingTasks, inProgressTasks, completedTasks, overdueTasks, onTimeCompletion,
 totalReceivable, revenueThisMonth, revenueLastMonth, totalExpenses, budgetUtilization,
 draftInvoices, activeInvoices, overdueInvoices, paidInvoices,
 equipmentAvailable, equipmentCheckedOut, equipmentInMaintenance,
 clientCount, month, recentTasks, todayAttendance, expenseByCategory,
 monthlyRevenueData, topClients, completedTasksThisMonth, tasksThisMonth,
 monthlyInvoicesPaid, monthlyInvoicesTotal,
 } = data

 // Compute health score the same way as admin dashboard
 const taskHealth = completedTasks + inProgressTasks > 0 ? Math.round((onTimeCompletion / 100) * 100) : 50
 const financeHealth = totalExpenses > 0 ? Math.round((1 - Math.min(budgetUtilization / 100, 1)) * 100) : 70
 const equipHealth = equipmentAvailable + equipmentCheckedOut + equipmentInMaintenance > 0
 ? Math.round((equipmentAvailable / (equipmentAvailable + equipmentCheckedOut + equipmentInMaintenance)) * 100) : 80
 const healthScore = Math.round(attendanceRate * 0.25 + taskHealth * 0.25 + financeHealth * 0.20 + projectHealthPercent * 0.15 + equipHealth * 0.15)

 const totalTasks = pendingTasks + inProgressTasks + completedTasks

 const revenueTrend = revenueThisMonth > revenueLastMonth
 ? { direction: 'up' as const, text: `${((revenueThisMonth - revenueLastMonth) / Math.max(revenueLastMonth, 1) * 100).toFixed(0)}%` }
 : revenueThisMonth < revenueLastMonth
 ? { direction: 'down' as const, text: `${((revenueLastMonth - revenueThisMonth) / Math.max(revenueLastMonth, 1) * 100).toFixed(0)}%` }
 : undefined

 return (
 <div className="space-y-8 lg:space-y-12 overflow-x-hidden w-full max-w-full">

 {/* ─── HEADER ─── */}
 <section className="morph-fade-in">
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
 <div className="max-w-3xl">
 <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight flex items-center gap-3">
 <LayoutDashboard className="w-8 h-8 text-m3-warning" />
 Founder&apos;s Overview
 </h1>
 <p className="text-base text-on-surface-variant mt-2">
 {month} — Full company snapshot: {totalEmployees} employees, {activeProjects} active projects, {clientCount} clients.
 </p>
 </div>
 <HealthScore score={healthScore} />
 </div>
 </section>

 {/* ─── PEOPLE DOMAIN ─── */}
 <section className="morph-fade-in morph-delay-2">
 <SectionHeader
 icon={Users} title="People & Attendance"
 subtitle={`${checkedInToday} checked in today · ${attendanceRate}% attendance rate`}
 />
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
 <StatCard label="Total Employees" value={totalEmployees} icon={Users} color="primary" href="/founder/employees" delay={40} />
 <StatCard label="Checked In" value={checkedInToday} icon={CalendarCheck} color="emerald" suffix={`/${totalEmployees}`} delay={80} />
 <StatCard label="On Leave" value={onLeaveToday} icon={CalendarOff} color="amber" delay={120} />
 <StatCard label="Late" value={lateToday} icon={Clock} color={lateToday > 1 ? 'error' : 'secondary'} delay={160} />
 <StatCard label="Absent" value={absentToday} icon={Timer} color={absentToday > 0 ? 'error' : 'emerald'} delay={200} />
 <StatCard label="Attendance Rate" value={attendanceRate} icon={Percent} color={attendanceRate >= 80 ? 'emerald' : attendanceRate >= 60 ? 'amber' : 'error'} suffix="%" decimals={1} delay={240} />
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
 <DomainScore label="Attendance Health" score={Math.round(attendanceRate)} max={100} icon={HeartPulse} />
 <DomainScore label="Check-in Today" score={checkedInToday} max={totalEmployees} icon={Target} />
 <DomainScore label="Leave Utilization" score={onLeaveToday} max={Math.max(totalEmployees, 1)} icon={CalendarOff} />
 </div>
 </section>

 {/* ─── PRODUCTION DOMAIN ─── */}
 <section className="morph-fade-in morph-delay-3">
 <SectionHeader icon={FolderKanban} title="Production & Tasks"
 subtitle={`${completedTasks} completed · ${pendingTasks + inProgressTasks} active · ${overdueTasks} overdue`} />
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
 <StatCard label="Active Projects" value={activeProjects} icon={FolderKanban} color="primary" subtitle={`${projectHealthPercent}% healthy`} delay={40} />
 <StatCard label="Completed Projects" value={completedProjects} icon={FolderKanban} color="tertiary" delay={80} />
 <StatCard label="Total Tasks" value={totalTasks} icon={CheckSquare} color="secondary" delay={120} />
 <StatCard label="In Progress" value={inProgressTasks} icon={Activity} color="primary" delay={160} />
 <StatCard label="Completed" value={completedTasks} icon={CheckSquare} color="emerald" delay={200} />
 <StatCard label="Overdue" value={overdueTasks} icon={AlertTriangle} color={overdueTasks > 0 ? 'error' : 'emerald'} delay={240} />
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
 <DomainScore label="Task Completion (This Month)" score={completedTasksThisMonth} max={Math.max(tasksThisMonth, 1)} icon={Target} />
 <DomainScore label="Project Health" score={projectHealthPercent} max={100} icon={BarChart3} />
 <DomainScore label="On-Time Delivery" score={Math.round(onTimeCompletion)} max={100} icon={Gauge} />
 </div>
 </section>

 {/* ─── FINANCE DOMAIN ─── */}
 <section className="morph-fade-in morph-delay-4">
 <SectionHeader icon={DollarSign} title="Finance & Revenue"
 subtitle={`Receivable: ${totalReceivable.toLocaleString()} · Expenses: ${totalExpenses.toLocaleString()}`} />
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
 <StatCard label="Revenue This Month" value={revenueThisMonth} icon={TrendingUp} color={revenueThisMonth >= revenueLastMonth ? 'emerald' : 'amber'}
 trend={revenueTrend} delay={40} />
 <StatCard label="Receivables" value={totalReceivable} icon={Receipt} color="amber" delay={80} />
 <StatCard label="Total Expenses" value={totalExpenses} icon={Wallet} color="secondary" delay={120} />
 <StatCard label="Budget Used" value={budgetUtilization} icon={Percent} color={budgetUtilization <= 70 ? 'emerald' : budgetUtilization <= 85 ? 'amber' : 'error'} suffix="%" decimals={1} delay={160} />
 <StatCard label="Paid Invoices" value={paidInvoices} icon={CheckSquare} color="emerald" delay={200} />
 <StatCard label="Overdue Invoices" value={overdueInvoices} icon={AlertTriangle} color={overdueInvoices > 0 ? 'error' : 'emerald'} delay={240} />
 </div>

 {/* Monthly Revenue mini chart */}
 {monthlyRevenueData.length > 0 && (
 <div className="mt-4 rounded-2xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/40 card-morph">
 <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Monthly Revenue</h4>
 <div className="flex items-end gap-2 h-28">
 {monthlyRevenueData.map((item) => {
 const maxRev = Math.max(...monthlyRevenueData.map(d => d.revenue), 1)
 const heightPct = (item.revenue / maxRev) * 100
 return (
 <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
 <span className="text-[9px] text-on-surface-variant tabular-nums font-medium">
 {item.revenue >= 1000 ? `${(item.revenue / 1000).toFixed(1)}k` : item.revenue}
 </span>
 <div className="w-full rounded-md bg-primary/20 relative overflow-hidden" style={{ height: `${Math.max(heightPct, 4)}%` }}>
 <div className="absolute bottom-0 w-full bg-primary rounded-md transition-all duration-700" style={{ height: `${heightPct}%` }} />
 </div>
 <span className="text-[8px] text-outline font-medium truncate w-full text-center">{item.month}</span>
 </div>
 )
 })}
 </div>
 </div>
 )}

 {/* Top Clients */}
 {topClients.length > 0 && (
 <div className="mt-3 rounded-2xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/40 card-morph">
 <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Top Clients by Revenue</h4>
 <div className="space-y-2">
 {topClients.map((client, i) => {
 const maxRev = topClients[0]?.revenue || 1
 const pct = (client.revenue / maxRev) * 100
 return (
 <div key={client.company_name} className="flex items-center gap-3">
 <span className="w-5 text-xs font-bold text-on-surface-variant text-right">{i + 1}</span>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between text-xs mb-0.5">
 <span className="font-medium text-foreground truncate">{client.company_name}</span>
 <span className="text-on-surface-variant tabular-nums">{client.revenue.toLocaleString()}</span>
 </div>
 <MiniProgress value={pct} max={100} color="primary" />
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )}

 {/* Expense by Category */}
 {expenseByCategory.length > 0 && (
 <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
 {expenseByCategory.slice(0, 6).map((cat) => {
 const totalCat = expenseByCategory.reduce((s, c) => s + c.total, 0)
 const pct = totalCat > 0 ? Math.round((cat.total / totalCat) * 100) : 0
 return (
 <div key={cat.category} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-high card-morph">
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <span className="text-xs font-medium text-foreground truncate">{cat.category}</span>
 <span className="text-[11px] font-bold text-on-surface-variant tabular-nums">{cat.total.toLocaleString()} ({pct}%)</span>
 </div>
 <MiniProgress value={pct} max={100} color="amber" />
 </div>
 </div>
 )
 })}
 </div>
 )}
 </section>

 {/* ─── ASSETS DOMAIN ─── */}
 <section className="morph-fade-in morph-delay-5">
 <SectionHeader icon={Camera} title="Equipment & Resources"
 subtitle={`${equipmentAvailable} available · ${equipmentCheckedOut} checked out · ${equipmentInMaintenance} in maintenance`} />
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 <StatCard label="Available" value={equipmentAvailable} icon={Camera} color="emerald" delay={40} />
 <StatCard label="Checked Out" value={equipmentCheckedOut} icon={Briefcase} color="amber" delay={80} />
 <StatCard label="In Maintenance" value={equipmentInMaintenance} icon={Timer} color={equipmentInMaintenance > 0 ? 'error' : 'secondary'} delay={120} />
 <StatCard label="Total Clients" value={clientCount} icon={UserSquare2} color="tertiary" delay={160} />
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
 <DomainScore label="Equipment Availability" score={equipmentAvailable} max={Math.max(equipmentAvailable + equipmentCheckedOut + equipmentInMaintenance, 1)} icon={Camera} />
 <DomainScore label="Collection Rate (This Month)" score={monthlyInvoicesPaid} max={Math.max(monthlyInvoicesTotal, 1)} icon={DollarSign} />
 </div>
 </section>

 {/* ─── BOTTOM ROW ─── */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

 {/* Today's Attendance */}
 <div className="rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/40 overflow-hidden card-morph morph-fade-in morph-delay-6">
 <div className="px-5 pt-5">
 <SectionHeader icon={Clock} title="Today's Attendance"
 subtitle={todayAttendance.length > 0 ? `${todayAttendance.length} entries recorded` : 'No entries yet'} />
 </div>
 <div className="px-5 pb-5">
 {todayAttendance && todayAttendance.length > 0 ? (
 <div className="divide-y divide-outline-variant/20">
 {todayAttendance.slice(0, 8).map((entry: any, i: number) => (
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
 {todayAttendance.length > 8 && (
 <div className="py-3 text-center text-xs text-on-surface-variant">+{todayAttendance.length - 8} more entries</div>
 )}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mb-3">
 <Clock className="w-6 h-6 text-on-surface-variant" />
 </div>
 <p className="text-sm text-on-surface-variant font-medium">No attendance records for today.</p>
 </div>
 )}
 </div>
 </div>

 {/* Recent Tasks */}
 <div className="rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/40 overflow-hidden card-morph morph-fade-in morph-delay-7">
 <div className="px-5 pt-5">
 <SectionHeader icon={Activity} title="Recent Tasks"
 subtitle={recentTasks.length > 0 ? 'Latest assignments across projects' : 'No recent tasks'} />
 </div>
 <div className="px-5 pb-5">
 {recentTasks && recentTasks.length > 0 ? (
 <div className="divide-y divide-outline-variant/20">
 {recentTasks.map((task: any, i: number) => {
 const projectName = task.projects?.title || 'Project'
 const match = task.title?.match(/^E5_Task_\d+\s*-\s*(.*)/)
 const displayTitle = match ? `${projectName} — ${match[1]}` : `${projectName} — ${task.title}`
 return (
 <div key={task.id} className={cn('flex items-center justify-between gap-3 py-2.5', i === 0 && 'pt-0')}>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <div className={cn('w-1.5 h-1.5 rounded-full shrink-0',
 task.status === 'completed' ? 'bg-tertiary' : task.status === 'in_progress' ? 'bg-primary' : 'bg-outline')} />
 <span className="text-sm font-medium text-foreground truncate">{displayTitle}</span>
 </div>
 <div className="text-xs text-on-surface-variant mt-0.5 ml-3.5 truncate">
 {task.profiles?.full_name || 'Unassigned'} · {projectName}
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

 {/* ─── Footer snapshot ─── */}
 <div className="rounded-2xl bg-gradient-to-br from-primary-container to-surface-container-lowest ring-1 ring-primary/20 p-5 card-morph morph-fade-in morph-delay-8">
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 {[
 { label: 'Revenue', value: revenueThisMonth.toLocaleString(), icon: TrendingUp },
 { label: 'Active Projects', value: String(activeProjects), icon: FolderKanban },
 { label: 'Team Size', value: String(totalEmployees), icon: Users },
 { label: 'Equipment', value: `${equipmentAvailable}/${equipmentAvailable + equipmentCheckedOut + equipmentInMaintenance} avail`, icon: Camera },
 ].map(item => (
 <div key={item.label} className="text-center p-3">
 <item.icon className="w-5 h-5 text-on-primary-container/60 mx-auto mb-1" />
 <div className="text-lg font-bold text-on-primary-container tabular-nums">{item.value}</div>
 <div className="text-[10px] text-on-primary-container/60 font-medium uppercase tracking-wider">{item.label}</div>
 </div>
 ))}
 </div>
 <div className="mt-3 pt-3 border-t border-primary/20 flex items-center justify-center gap-2">
 <span className={cn('w-2 h-2 rounded-full animate-pulse', healthScore >= 80 ? 'bg-m3-success' : healthScore >= 60 ? 'bg-m3-warning' : 'bg-m3-error')} />
 <span className="text-xs text-on-primary-container/70 font-medium">
 Company Health: {healthScore >= 80 ? 'Healthy' : healthScore >= 60 ? 'Needs attention' : 'Critical'} ({Math.round(healthScore)}%)
 </span>
 </div>
 </div>
 </div>
 )
}
