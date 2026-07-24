/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useCallback, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addMonths, subMonths, addWeeks, subWeeks, format } from 'date-fns'
import { CalendarMonthGrid } from './calendar-month-grid'

interface CalendarTask {
 id: string
 title: string
 phase: string | null
 start_date: string | null
 deadline: string | null
 status: string
 assigned_to: string | null
 profiles: { full_name: string } | null
 projects: { title: string; id: string; status: string; clients: { company_name: string } | null }
}

interface CalendarLeave {
 id: string
 user_id: string
 start_date: string
 end_date: string
 profiles: { full_name: string } | null
 leave_types: { name: string } | null
}

interface CalendarHoliday {
 id: string
 name: string
 date: string
}

interface CalendarMeeting {
 id: string
 title: string
 meeting_date: string
 duration_minutes: number | null
 location: string | null
 status: string
 clients: { company_name: string } | null
}

interface EmployeeInfo {
 id: string
 full_name: string
}

interface ProjectInfo {
 id: string
 title: string
 client_name: string | null
 start_date: string | null
 end_date: string | null
}

interface ClientInfo {
 id: string
 company_name: string
}

interface OverdueTask {
 id: string
 title: string
 deadline: string | null
 assigned_to: string | null
 status: string
 phase: string | null
 profiles: { full_name: string } | null
 projects: { title: string; clients: { company_name: string } | null }
}

interface ProjectBudget {
 project_id: string
 budget_amount: number
 contingency_percent: number
 projects: { title: string; status: string; clients: { company_name: string } | null }
}

interface CalendarPackageShoot {
  id: string
  shoot_date: string
  location_address: string | null
  package_id: string
  package_title: string
  package_number: string
  client_id: string | null
  client_name: string | null
}

type ViewMode = 'month' | 'week'

export function ProductionCalendar({
  initialTasks,
  initialLeaves,
  initialHolidays,
  initialMeetings = [],
  initialShoots = [],
  allEmployees = [],
  allProjects = [],
  allClients = [],
  overdueTasks = [],
  projectBudgets = [],
  expenseByProject = {},
  workloadByEmployee = {},
}: {
  initialTasks: CalendarTask[]
  initialLeaves: CalendarLeave[]
  initialHolidays: CalendarHoliday[]
  initialMeetings?: CalendarMeeting[]
  initialShoots?: CalendarPackageShoot[]
  allEmployees?: EmployeeInfo[]
  allProjects?: ProjectInfo[]
  allClients?: ClientInfo[]
  overdueTasks?: OverdueTask[]
  projectBudgets?: ProjectBudget[]
  expenseByProject?: Record<string, number>
  workloadByEmployee?: Record<string, { total: number; pending: number; in_progress: number; completed: number; employee_name: string }>
}) {
 const [currentDate, setCurrentDate] = useState(new Date())
 const [viewMode, setViewMode] = useState<ViewMode>('month')
 const [projectFilter, setProjectFilter] = useState('')
 const [employeeFilter, setEmployeeFilter] = useState('')
 const [clientFilter, setClientFilter] = useState('')

 // Employee list (use all employees from server)
 const employeeList = useMemo(() => {
 if (allEmployees.length > 0) return allEmployees
 const map = new Map<string, string>()
 initialTasks.forEach(t => {
 if (t.assigned_to && t.profiles?.full_name) {
 map.set(t.assigned_to, t.profiles.full_name)
 }
 })
 return Array.from(map.entries()).map(([id, name]) => ({ id, full_name: name }))
 }, [allEmployees, initialTasks])

 // Employee workload sorted by load (highest pending first)
 const sortedWorkload = useMemo(() => {
 return Object.entries(workloadByEmployee)
 .sort(([, a], [, b]) => (b.pending + b.in_progress) - (a.pending + a.in_progress))
 }, [workloadByEmployee])

 // Budget alerts — projects where expenses > 80% of budget
 const budgetAlerts = useMemo(() => {
 return projectBudgets.filter(b => {
 if (!b.budget_amount) return false
 const spent = expenseByProject[b.project_id] || 0
 return spent / b.budget_amount > 0.8
 })
 }, [projectBudgets, expenseByProject])

 const navigatePrev = useCallback(() => {
 if (viewMode === 'month') setCurrentDate(d => subMonths(d, 1))
 else setCurrentDate(d => subWeeks(d, 1))
 }, [viewMode])

 const navigateNext = useCallback(() => {
 if (viewMode === 'month') setCurrentDate(d => addMonths(d, 1))
 else setCurrentDate(d => addWeeks(d, 1))
 }, [viewMode])

 const goToday = useCallback(() => {
 setCurrentDate(new Date())
 }, [])

 const isFilterActive = (val: string) => val && val !== 'all'

 const filteredTasks = useMemo(() => {
 return initialTasks.filter(t => {
 if (isFilterActive(projectFilter) && t.projects?.id !== projectFilter) return false
 if (isFilterActive(employeeFilter) && t.assigned_to !== employeeFilter) return false
 if (isFilterActive(clientFilter) && t.projects?.clients?.company_name !== allClients.find(c => c.id === clientFilter)?.company_name) return false
 return true
 })
 }, [initialTasks, projectFilter, employeeFilter, clientFilter, allClients])

 const filteredLeaves = useMemo(() => {
 return initialLeaves.filter(l => {
 if (isFilterActive(employeeFilter) && l.user_id !== employeeFilter) return false
 return true
 })
 }, [initialLeaves, employeeFilter])

 const filteredMeetings = useMemo(() => {
 if (!isFilterActive(clientFilter)) return initialMeetings
 return initialMeetings.filter(m => {
 const clientName = allClients.find(c => c.id === clientFilter)?.company_name
 return m.clients?.company_name === clientName
 })
 }, [initialMeetings, clientFilter, allClients])

  const filteredProjects = useMemo(() => {
    return allProjects.filter(p => {
      if (isFilterActive(projectFilter) && p.id !== projectFilter) return false
      if (isFilterActive(clientFilter) && p.client_name !== allClients.find(c => c.id === clientFilter)?.company_name) return false
      return true
    })
  }, [allProjects, projectFilter, clientFilter, allClients])

  const filteredShoots = useMemo(() => {
    if (!isFilterActive(clientFilter)) return initialShoots
    const clientName = allClients.find(c => c.id === clientFilter)?.company_name
    return initialShoots.filter(s => s.client_name === clientName)
  }, [initialShoots, clientFilter, allClients])

 return (
 <div className="flex flex-col h-[calc(100vh-10rem)] space-y-3">
 {/* CEO/Admin Insights Banner */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 morph-fade-in">
 {/* Overdue Tasks */}
 <div className="bg-surface-container-lowest border border-outline-variant/50 shape-medium px-3 py-2 elevation-1 card-morph">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Overdue</span>
 <span className={`text-lg font-bold ${overdueTasks.length > 0 ? 'text-m3-error' : 'text-m3-success'}`}>
 {overdueTasks.length}
 </span>
 </div>
 {overdueTasks.length > 0 && (
 <p className="text-[10px] text-m3-error mt-0.5 truncate">
 {overdueTasks.slice(0, 2).map(t => t.projects?.title || 'Task').join(',')}
 {overdueTasks.length > 2 && ` +${overdueTasks.length - 2} more`}
 </p>
 )}
 </div>

 {/* Budget Alerts */}
 <div className="bg-surface-container-lowest border border-outline-variant/50 shape-medium px-3 py-2 elevation-1 card-morph">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Budget Alert</span>
 <span className={`text-lg font-bold ${budgetAlerts.length > 0 ? 'text-m3-warning' : 'text-m3-success'}`}>
 {budgetAlerts.length}
 </span>
 </div>
 {budgetAlerts.length > 0 && (
 <p className="text-[10px] text-m3-warning mt-0.5 truncate">
 {budgetAlerts.slice(0, 2).map(b => b.projects?.title || 'Project').join(',')}
 {budgetAlerts.length > 2 && ` +${budgetAlerts.length - 2} more`}
 </p>
 )}
 </div>

 {/* Active Projects */}
 <div className="bg-surface-container-lowest border border-outline-variant/50 shape-medium px-3 py-2 elevation-1 card-morph">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Active Projects</span>
 <span className="text-lg font-bold text-primary">{allProjects.length}</span>
 </div>
 <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
 {allEmployees.length} employees · {initialTasks.length} tasks
 </p>
 </div>

 {/* Heaviest Workload */}
 <div className="bg-surface-container-lowest border border-outline-variant/50 shape-medium px-3 py-2 elevation-1 card-morph">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Most Loaded</span>
 <span className="text-lg font-bold text-primary">
 {sortedWorkload.length > 0 ? sortedWorkload[0][1].pending + sortedWorkload[0][1].in_progress : 0}
 </span>
 </div>
 <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
 {sortedWorkload[0]?.[1]?.employee_name || 'N/A'} · {sortedWorkload[0]?.[1]?.total || 0} total tasks
 </p>
 </div>
 </div>

 {/* Filters */}
 <div className="flex flex-wrap gap-2 shrink-0 items-center">
 <Select value={projectFilter} onValueChange={(v) => { if (v !== null) setProjectFilter(v); }}>
 <SelectTrigger className="w-[180px] h-8">
 <span className="flex items-center gap-1.5 truncate">
 {projectFilter && projectFilter !== 'all'
 ? (allProjects.find(p => p.id === projectFilter)?.title || 'All Projects')
 : 'All Projects'}
 </span>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Projects</SelectItem>
 {allProjects.map(p => (
 <SelectItem key={p.id} value={p.id}>
 {p.title}{p.client_name ? ` (${p.client_name})` : ''}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 <Select value={clientFilter} onValueChange={(v) => { if (v !== null) setClientFilter(v); }}>
 <SelectTrigger className="w-[180px] h-8">
 <span className="flex items-center gap-1.5 truncate">
 {clientFilter && clientFilter !== 'all'
 ? (allClients.find(c => c.id === clientFilter)?.company_name || 'All Clients')
 : 'All Clients'}
 </span>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Clients</SelectItem>
 {allClients.map(c => (
 <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 <Select value={employeeFilter} onValueChange={(v) => { if (v !== null) setEmployeeFilter(v); }}>
 <SelectTrigger className="w-[180px] h-8">
 <span className="flex items-center gap-1.5 truncate">
 {employeeFilter && employeeFilter !== 'all'
 ? (employeeList.find(e => e.id === employeeFilter)?.full_name || 'All Employees')
 : 'All Employees'}
 </span>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Employees</SelectItem>
 {employeeList.map(e => (
 <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
  <div className="flex items-center gap-3 ml-auto text-xs text-on-surface-variant">
  <span className="flex items-center gap-1">
  <span className="w-2.5 h-2.5 rounded bg-[#0ea5e9] inline-block"></span> Task
  </span>
  <span className="flex items-center gap-1">
  <span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block"></span> Shoot
  </span>
  <span className="flex items-center gap-1">
  <span className="w-2.5 h-2.5 rounded bg-[#f59e0b] opacity-75 inline-block"></span> Leave
  </span>
  <span className="flex items-center gap-1">
  <span className="w-2.5 h-2.5 rounded bg-[#06b6d4] inline-block"></span> Meeting
  </span>
  <span className="flex items-center gap-1">
  <span className="w-2.5 h-2.5 rounded bg-red-100 border border-red-300 inline-block"></span> Holiday
  </span>
  </div>
  </div>

  {/* Month Grid */}
  <div className="flex-1 overflow-auto border border-outline-variant/50 rounded-xl bg-surface-container-lowest elevation-1 p-4">
  <CalendarMonthGrid
  currentDate={currentDate}
  tasks={filteredTasks}
  leaves={filteredLeaves}
  holidays={initialHolidays}
  meetings={filteredMeetings}
  shoots={filteredShoots}
  projects={filteredProjects}
  allEmployees={allEmployees}
  allProjects={allProjects}
  allClients={allClients}
 projectFilter={projectFilter}
 employeeFilter={employeeFilter}
 clientFilter={clientFilter}
 viewMode={viewMode}
 onNavigatePrev={navigatePrev}
 onNavigateNext={navigateNext}
 onToday={goToday}
 onViewModeChange={setViewMode}
 />
 </div>
 </div>
 )
}
