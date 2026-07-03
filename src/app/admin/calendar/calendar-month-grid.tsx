'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
 format,
 startOfMonth,
 endOfMonth,
 startOfWeek,
 endOfWeek,
 eachDayOfInterval,
 isSameMonth,
 isSameDay,
 isToday,
 parseISO,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

function hashColor(str: string): string {
 let hash = 0
 for (let i = 0; i < str.length; i++) {
 hash = str.charCodeAt(i) + ((hash << 5) - hash)
 }
 const colors = [
 '#0ea5e9', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6',
 '#f59e0b', '#6366f1', '#84cc16', '#d946ef', '#06b6d4', '#e11d48',
 ]
 return colors[Math.abs(hash) % colors.length]
}

function statusColor(status: string, isOverdue: boolean): string {
 if (isOverdue) return '#dc2626' // red for overdue
 switch (status) {
 case 'completed': return '#22c55e'
 case 'in_progress': return '#0ea5e9'
 default: return '#94a3b8' // pending/other — slate
 }
}

function statusLabel(status: string): string {
 switch (status) {
 case 'in_progress': return 'IP'
 case 'completed': return 'Done'
 default: return 'TODO'
 }
}

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

type ViewMode = 'month' | 'week'

export function CalendarMonthGrid({
 currentDate,
 tasks,
 leaves,
 holidays,
 meetings,
 projects,
 allEmployees,
 allProjects,
 allClients,
 projectFilter,
 employeeFilter,
 clientFilter,
 viewMode,
 onNavigatePrev,
 onNavigateNext,
 onToday,
 onViewModeChange,
}: {
 currentDate: Date
 tasks: CalendarTask[]
 leaves: CalendarLeave[]
 holidays: CalendarHoliday[]
 meetings: CalendarMeeting[]
 projects: ProjectInfo[]
 allEmployees: EmployeeInfo[]
 allProjects: ProjectInfo[]
 allClients: ClientInfo[]
 projectFilter: string
 employeeFilter: string
 clientFilter: string
 viewMode: ViewMode
 onNavigatePrev: () => void
 onNavigateNext: () => void
 onToday: () => void
 onViewModeChange: (mode: ViewMode) => void
}) {
 const router = useRouter()
 const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

 // Compute visible days
 const visibleDays = useMemo(() => {
 if (viewMode === 'month') {
 const mStart = startOfMonth(currentDate)
 const mEnd = endOfMonth(currentDate)
 return eachDayOfInterval({ start: startOfWeek(mStart), end: endOfWeek(mEnd) })
 }
 const wStart = startOfWeek(currentDate)
 const wEnd = endOfWeek(currentDate)
 return eachDayOfInterval({ start: wStart, end: wEnd })
 }, [currentDate, viewMode])

 const headerLabel = useMemo(() => {
 if (viewMode === 'month') {
 return format(currentDate, 'MMMM yyyy')
 }
 const wStart = startOfWeek(currentDate)
 const wEnd = endOfWeek(currentDate)
 return `${format(wStart, 'MMM d')} - ${format(wEnd, 'MMM d, yyyy')}`
 }, [currentDate, viewMode])

 // Holiday dates set for quick lookup
 const holidayDates = useMemo(() => {
 const map = new Map<string, string>()
 holidays.forEach(h => map.set(h.date, h.name))
 return map
 }, [holidays])

 // Today's date string for overdue check
 const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

 // Group tasks by date — a task appears on every day from start_date through deadline
 const tasksByDate = useMemo(() => {
 const map = new Map<string, CalendarTask[]>()
 tasks.forEach(t => {
 const start = t.start_date ? parseISO(t.start_date) : null
 const end = t.deadline ? parseISO(t.deadline) : null
 if (!start && !end) return

 const rangeStart = start || end!
 const rangeEnd = end || start!

 // Clamp to visible range
 const visibleStart = startOfWeek(startOfMonth(currentDate))
 const visibleEnd = endOfWeek(endOfMonth(currentDate))

 const actualStart = rangeStart < visibleStart ? visibleStart : rangeStart
 const actualEnd = rangeEnd > visibleEnd ? visibleEnd : rangeEnd

 if (actualStart > actualEnd) return

 const days = eachDayOfInterval({ start: actualStart, end: actualEnd })
 days.forEach(d => {
 const key = format(d, 'yyyy-MM-dd')
 if (!map.has(key)) map.set(key, [])
 map.get(key)!.push(t)
 })
 })
 return map
 }, [tasks, currentDate])

 // Group projects by date
 const projectsByDate = useMemo(() => {
 const map = new Map<string, ProjectInfo[]>()
 projects.forEach(p => {
 const start = p.start_date ? parseISO(p.start_date) : null
 const end = p.end_date ? parseISO(p.end_date) : null
 if (!start && !end) return

 const rangeStart = start || end!
 const rangeEnd = end || start!

 // Clamp to visible range
 const visibleStart = startOfWeek(startOfMonth(currentDate))
 const visibleEnd = endOfWeek(endOfMonth(currentDate))

 const actualStart = rangeStart < visibleStart ? visibleStart : rangeStart
 const actualEnd = rangeEnd > visibleEnd ? visibleEnd : rangeEnd

 if (actualStart > actualEnd) return

 const days = eachDayOfInterval({ start: actualStart, end: actualEnd })
 days.forEach(d => {
 const key = format(d, 'yyyy-MM-dd')
 if (!map.has(key)) map.set(key, [])
 map.get(key)!.push(p)
 })
 })
 return map
 }, [projects, currentDate])

 // Group leaves by date
 const leavesByDate = useMemo(() => {
 const map = new Map<string, CalendarLeave[]>()
 leaves.forEach(l => {
 const start = new Date(l.start_date)
 const end = new Date(l.end_date)
 const days = eachDayOfInterval({ start, end })
 days.forEach(d => {
 const key = format(d, 'yyyy-MM-dd')
 if (!map.has(key)) map.set(key, [])
 map.get(key)!.push(l)
 })
 })
 return map
 }, [leaves])

 // Group meetings by date
 const meetingsByDate = useMemo(() => {
 const map = new Map<string, CalendarMeeting[]>()
 meetings.forEach(m => {
 const key = format(new Date(m.meeting_date), 'yyyy-MM-dd')
 if (!map.has(key)) map.set(key, [])
 map.get(key)!.push(m)
 })
 return map
 }, [meetings])

 // Day cell data
 const dayCellData = useMemo(() => {
 return visibleDays.map(d => {
 const key = format(d, 'yyyy-MM-dd')
 const dayTasks = tasksByDate.get(key) || []
 const dayLeaves = leavesByDate.get(key) || []
 const dayMeetings = meetingsByDate.get(key) || []
 const dayProjects = projectsByDate.get(key) || []
 const holidayName = holidayDates.get(key) || null
 return {
 date: d,
 key,
 dayOfMonth: d.getDate(),
 isCurrentMonth: isSameMonth(d, currentDate),
 isToday: isToday(d),
 isWeekend: d.getDay() === 0 || d.getDay() === 6,
 isHoliday: !!holidayName,
 holidayName,
 tasks: dayTasks,
 leaves: dayLeaves,
 meetings: dayMeetings,
 projects: dayProjects,
 total: dayTasks.length + dayMeetings.length + dayProjects.length + (dayLeaves.length > 0 ? 1 : 0),
 }
 })
 }, [visibleDays, tasksByDate, leavesByDate, meetingsByDate, projectsByDate, holidayDates, currentDate])

 // Selected day detail
 const selectedDayData = useMemo(() => {
 if (!selectedDay) return null
 return dayCellData.find(d => isSameDay(d.date, selectedDay)) || null
 }, [selectedDay, dayCellData])

 // Today's leave (who is out today)
 const todayLeave = useMemo(() => {
 const today = format(new Date(), 'yyyy-MM-dd')
 return leaves.filter(l => {
 const start = l.start_date
 const end = l.end_date
 return today >= start && today <= end
 })
 }, [leaves])

 const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

 return (
 <div className="flex flex-col h-full">
 {/* Navigation header */}
 <div className="flex items-center justify-between mb-4 shrink-0">
 <div className="flex items-center gap-2">
 <Button variant="outline" size="sm" onClick={onNavigatePrev}>
 <ChevronLeft className="w-4 h-4" />
 </Button>
 <h2 className="text-lg font-semibold text-on-surface min-w-[200px] text-center">
 {headerLabel}
 </h2>
 <Button variant="outline" size="sm" onClick={onNavigateNext}>
 <ChevronRight className="w-4 h-4" />
 </Button>
 <Button variant="outline" size="sm" onClick={onToday} className="ml-2">
 Today
 </Button>
 </div>
 <div className="flex items-center gap-1">
 <Button
 variant={viewMode === 'month' ? 'default' : 'outline'}
 size="sm"
 onClick={() => onViewModeChange('month')}
 >
 Month
 </Button>
 <Button
 variant={viewMode === 'week' ? 'default' : 'outline'}
 size="sm"
 onClick={() => onViewModeChange('week')}
 >
 Week
 </Button>
 </div>
 </div>

 {/* Today's leave banner */}
 {todayLeave.length > 0 && (
 <div className="flex items-center gap-2 text-xs text-m3-warning bg-m3-warning-subtle border border-m3-warning rounded-lg px-3 py-1.5 mb-2 shrink-0">
 <span className="font-semibold">🏖 Out today:</span>
 {todayLeave.map(l => (
 <span key={l.id}>
 {l.profiles?.full_name || 'Someone'} ({l.leave_types?.name || 'Leave'})
 </span>
 ))}
 </div>
 )}

 {/* Day headers */}
 <div className="grid grid-cols-7 mb-1 shrink-0">
 {dayHeaders.map(day => (
 <div
 key={day}
 className="text-center text-xs font-semibold text-on-surface-variant uppercase tracking-wider py-2 border-b border-outline-variant"
 >
 {day}
 </div>
 ))}
 </div>

 {/* Grid */}
 <div className="flex-1 overflow-auto">
 <div className="grid grid-cols-7 h-full auto-rows-fr">
 {dayCellData.map((cell, i) => {
 // Compute overdue tasks for this cell
 const overdueTasks = cell.tasks.filter(t =>
 t.deadline && t.deadline < todayStr && t.status !== 'completed'
 )
 const hasOverdue = overdueTasks.length > 0
 return (
 <div
 key={i}
 onClick={() => setSelectedDay(cell.date)}
 className={`
 relative min-h-[90px] p-1.5 border-b border-r border-outline-variant
 cursor-pointer transition-colors
 ${cell.isToday ? 'bg-m3-info-subtle' : ''}
 ${cell.isHoliday ? 'bg-red-50/50 dark:bg-red-950/10' : ''}
 ${!cell.isCurrentMonth ? 'bg-surface-container-low' : 'bg-surface-container-lowest'}
 ${cell.isWeekend && !cell.isHoliday && cell.isCurrentMonth ? 'bg-surface-container-low' : ''}
 ${hasOverdue ? 'ring-1 ring-red-300 dark:ring-red-800 ring-inset' : ''}
 ${selectedDay && isSameDay(cell.date, selectedDay) ? 'ring-2 ring-primary ring-inset z-10' : ''}
 hover:bg-surface-container-high
 `}
 >
 {/* Day number + count badge */}
 <div className="flex items-start justify-between mb-1">
 <span
 className={`
 text-sm font-medium leading-none
 ${cell.isToday ? 'bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full' : ''}
 ${cell.isHoliday ? 'text-m3-error ' : ''}
 ${!cell.isToday && cell.isCurrentMonth ? 'text-on-surface' : ''}
 ${!cell.isCurrentMonth ? 'text-outline' : ''}
 ${cell.isWeekend && cell.isCurrentMonth && !cell.isHoliday && !cell.isToday ? 'text-on-surface-variant' : ''}
 `}
 >
 {cell.dayOfMonth}
 </span>

 <div className="flex items-center gap-0.5">
 {/* Count badges */}
 {cell.tasks.length > 0 && (
 <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${hasOverdue ? 'bg-red-100 text-m3-error ' : 'bg-sky-100 text-primary dark:text-primary'}`}>
 {cell.tasks.length}
 </span>
 )}
 {cell.meetings.length > 0 && (
 <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400">
 {cell.meetings.length}
 </span>
 )}
 {cell.projects.length > 0 && (
 <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
 {cell.projects.length}
 </span>
 )}
 </div>
 </div>

 {/* Holiday name */}
 {cell.holidayName && (
 <div className="text-[10px] text-m3-error font-medium leading-tight mb-0.5 truncate">
 {cell.holidayName}
 </div>
 )}

 {/* Content indicators */}
 <div className="space-y-0.5">
 {/* Overdue highlight line */}
 {hasOverdue && (
 <div className="text-[9px] text-m3-error font-semibold">
 ⏰ {overdueTasks.length} overdue
 </div>
 )}

 {/* Task indicators — show compact chips */}
 {cell.tasks.slice(0, 3).map(task => {
 const shortTitle = task.title.replace(/^E5_Task_\d+\s*-\s*/i, '').trim()
 const displayTitle = shortTitle.length > 12 ? shortTitle.slice(0, 10) + '…' : shortTitle
 const empName = task.profiles?.full_name?.split('')[0] || ''
 const isOverdue = !!task.deadline && task.deadline < todayStr && task.status !== 'completed'
 const sColor = statusColor(task.status, isOverdue)
 const startDateStr = task.start_date ? format(parseISO(task.start_date), 'MMM d') : ''
 const dueDateStr = task.deadline ? format(parseISO(task.deadline), 'MMM d') : ''
 const dateInfo = startDateStr && dueDateStr ? `(${startDateStr}-${dueDateStr})` : (startDateStr ? `(From: ${startDateStr})` : (dueDateStr ? `(Due: ${dueDateStr})` : ''))
 const titleWithDates = dateInfo ? `${displayTitle} ${dateInfo}` : displayTitle
 return (
 <div
 key={task.id}
 onClick={(e) => {
 e.stopPropagation()
 if (task.projects?.id) router.push(`/admin/projects/${task.projects.id}`)
 }}
 className="text-[10px] leading-tight px-1 py-0.5 rounded text-white cursor-pointer hover:brightness-110 transition-all truncate font-medium"
 style={{ backgroundColor: sColor }}
 title={`${task.title} (${task.profiles?.full_name || 'Unassigned'}) - ${task.projects?.title || ''} [${task.status}]`}
 >
 <span className="opacity-80 text-[8px] uppercase mr-0.5">{statusLabel(task.status)}</span>
 {empName && <span className="opacity-90">[{empName}] </span>}
 {titleWithDates}
 </div>
 )
 })}
 {cell.tasks.length > 3 && (
 <div className="text-[10px] text-on-surface-variant font-medium pl-1">
 +{cell.tasks.length - 3} more
 </div>
 )}

 {/* Project indicators */}
 {cell.projects.slice(0, 2).map(p => {
 const startStr = p.start_date ? format(parseISO(p.start_date), 'MMM d') : ''
 const endStr = p.end_date ? format(parseISO(p.end_date), 'MMM d') : ''
 const dateInfo = startStr && endStr ? `(${startStr}-${endStr})` : (startStr ? `(From: ${startStr})` : (endStr ? `(Due: ${endStr})` : ''))
 return (
 <div
 key={p.id}
 onClick={(e) => {
 e.stopPropagation()
 router.push(`/admin/projects/${p.id}`)
 }}
 className="text-[10px] leading-tight px-1 py-0.5 rounded bg-indigo-500 text-white cursor-pointer hover:brightness-110 transition-all truncate font-medium"
 title={`${p.title}${p.client_name ? ` - ${p.client_name}` : ''}`}
 >
 💼 {p.title.length > 12 ? p.title.slice(0, 10) + '…' : p.title} {dateInfo}
 </div>
 )})}
 {cell.projects.length > 2 && (
 <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium pl-1">
 +{cell.projects.length - 2} more
 </div>
 )}

 {/* Meeting indicators */}
 {cell.meetings.slice(0, 2).map(m => (
 <div
 key={m.id}
 className="text-[10px] leading-tight px-1 py-0.5 rounded bg-cyan-500 text-white truncate font-medium"
 title={`${m.title}${m.clients?.company_name ? ` - ${m.clients.company_name}` : ''}${m.location ? ` @ ${m.location}` : ''}${m.duration_minutes ? ` (${m.duration_minutes}min)` : ''}`}
 >
 📅 {m.title.length > 12 ? m.title.slice(0, 10) + '…' : m.title}
 </div>
 ))}
 {cell.meetings.length > 2 && (
 <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium pl-1">
 +{cell.meetings.length - 2} more
 </div>
 )}

 {/* Leave indicator */}
 {cell.leaves.length > 0 && (
 <div className="text-[10px] leading-tight px-1 py-0.5 rounded bg-amber-400/80 text-white truncate font-medium">
 🏖 {cell.leaves[0].leave_types?.name || 'Leave'}{cell.leaves.length > 1 ? ` +${cell.leaves.length - 1}` : ''}
 </div>
 )}
 </div>

 {/* Weekend overlay */}
 {cell.isWeekend && cell.isCurrentMonth && !cell.holidayName && (
 <div className="absolute inset-0 pointer-events-none bg-surface-container-lowest/[0.02] dark:bg-surface-container-lowest/[0.02]" />
 )}
 </div>
 )
 })}
 </div>
 </div>

 {/* Selected day detail panel — always shown when a day is selected */}
 {selectedDayData && (
 <div className="shrink-0 border-t border-outline-variant bg-surface-container-lowest p-3 max-h-[240px] overflow-y-auto">
 <div className="flex items-center justify-between mb-2">
 <h3 className="text-sm font-semibold text-on-surface">
 {format(selectedDayData.date, 'EEEE, MMMM d, yyyy')}
 {selectedDayData.holidayName && (
 <span className="ml-2 text-m3-error" >🎉 {selectedDayData.holidayName}</span>
 )}
 </h3>
 <button
 onClick={() => setSelectedDay(null)}
 className="text-xs text-outline hover:text-on-surface"
 >
 Close
 </button>
 </div>

 {selectedDayData.total === 0 ? (
 <p className="text-xs text-outline py-2">No tasks, meetings, or leave on this day.</p>
 ) : (
 <div className="space-y-1">
 {selectedDayData.tasks.map(task => {
 const isOverdue = !!task.deadline && task.deadline < todayStr && task.status !== 'completed'
 return (
 <div
 key={task.id}
 onClick={() => task.projects?.id && router.push(`/admin/projects/${task.projects.id}`)}
 className="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-surface-container-low cursor-pointer hover:bg-surface-container-high"
 >
 <span
 className="w-2.5 h-2.5 rounded-full shrink-0"
 style={{ backgroundColor: statusColor(task.status, isOverdue) }}
 />
 <span className="flex-1 truncate text-on-surface">
 {task.title}
 {task.phase && <span className="text-outline ml-1">({task.phase})</span>}
 <span className="text-outline ml-1">
 {task.start_date || task.deadline ? `[${task.start_date ? format(parseISO(task.start_date), 'MMM d') : ''}${task.start_date && task.deadline ? ' - ' : ''}${task.deadline ? format(parseISO(task.deadline), 'MMM d') : ''}]` : ''}
 </span>
 </span>
 <span className="text-outline shrink-0">{task.profiles?.full_name || 'Unassigned'}</span>
 <span className="text-[10px] font-medium shrink-0 text-outline">
 {task.projects?.title || ''}
 </span>
 <span className={`text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded ${task.status === 'completed' ? 'bg-emerald-100 text-m3-success ' :
 task.status === 'in_progress' ? 'bg-sky-100 text-primary dark:bg-sky-900/30 dark:text-primary' :
 isOverdue ? 'bg-red-100 text-m3-error dark:bg-red-900/30 ' :
 'bg-surface-container-high text-on-surface-variant'
 }`}>
 {isOverdue ? 'OVERDUE' : task.status.replace('_', '')}
 </span>
 </div>
 )
 })}
 {selectedDayData.projects.map(p => (
 <div
 key={p.id}
 onClick={() => router.push(`/admin/projects/${p.id}`)}
 className="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-indigo-50 dark:bg-indigo-950/30 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-on-surface"
 >
 <span>💼</span>
 <span className="flex-1 truncate">
 {p.title}
 <span className="text-outline ml-1">
 {p.start_date || p.end_date ? `[${p.start_date ? format(parseISO(p.start_date), 'MMM d') : ''}${p.start_date && p.end_date ? ' - ' : ''}${p.end_date ? format(parseISO(p.end_date), 'MMM d') : ''}]` : ''}
 </span>
 </span>
 {p.client_name && <span className="text-outline">{p.client_name}</span>}
 <span className="text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
 PROJECT
 </span>
 </div>
 ))}
 {selectedDayData.meetings.map(m => (
 <div key={m.id} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-cyan-50 dark:bg-cyan-950/30 text-on-surface">
 <span>📅</span>
 <span className="flex-1 truncate">{m.title}</span>
 {m.duration_minutes && <span className="text-outline">{m.duration_minutes}min</span>}
 {m.location && <span className="text-outline">📍{m.location}</span>}
 {m.clients?.company_name && <span className="text-outline">{m.clients.company_name}</span>}
 </div>
 ))}
 {selectedDayData.leaves.map(l => (
 <div key={l.id} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-m3-warning-subtle text-on-surface">
 <span>🏖</span>
 <span className="flex-1 truncate">{l.leave_types?.name || 'Leave'} — {l.profiles?.full_name || ''}</span>
 <span className="text-outline">{format(new Date(l.start_date), 'MMM d')} → {format(new Date(l.end_date), 'MMM d')}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 )
}
