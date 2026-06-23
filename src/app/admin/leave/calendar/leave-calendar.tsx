'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
    eachDayOfInterval,
} from 'date-fns'

interface LeaveDay {
    date: string
    employees: { id: string; name: string; leaveType: string; status: string }[]
}

interface Holiday {
    id: string
    date: string
    name: string
    is_recurring: boolean
}

export function LeaveCalendar({ initialLeaveDays, initialHolidays, month }: { initialLeaveDays: LeaveDay[]; initialHolidays: Holiday[]; month: Date }) {
    const [currentMonth, setCurrentMonth] = useState(month)
    const [leaveDays] = useState(initialLeaveDays)
    const [holidays] = useState(initialHolidays)

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)

    const days = eachDayOfInterval({ start: calStart, end: calEnd })

    const leaveMap = new Map<string, LeaveDay['employees']>()
    for (const ld of leaveDays) {
        leaveMap.set(ld.date, ld.employees)
    }

    const holidayMap = new Map<string, Holiday[]>()
    for (const h of holidays) {
        const existing = holidayMap.get(h.date) || []
        existing.push(h)
        holidayMap.set(h.date, existing)
    }

    const leaveTypeColors: Record<string, string> = {
        'annual': 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
        'sick': 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
        'personal': 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
        'bereavement': 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
        'public_holiday': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    }

    function getLeaveColor(type: string): string {
        return leaveTypeColors[type.toLowerCase()] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
    }

    function prevMonth() { setCurrentMonth(subMonths(currentMonth, 1)) }
    function nextMonth() { setCurrentMonth(addMonths(currentMonth, 1)) }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <Button variant="outline" onClick={prevMonth} className="h-9">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                </Button>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <Button variant="outline" onClick={nextMonth} className="h-9">
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
                    {dayNames.map(name => (
                        <div key={name} className="px-3 py-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-950">
                            {name}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                    {days.map((day, idx) => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const dayLeave = leaveMap.get(dateStr) || []
                        const dayHolidays = holidayMap.get(dateStr) || []
                        const isCurrentMonth = isSameMonth(day, monthStart)
                        const isTodayDate = isToday(day)

                        return (
                            <div
                                key={idx}
                                className={`min-h-[100px] p-2 border-b border-r border-zinc-100 dark:border-zinc-800 ${!isCurrentMonth ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-white dark:bg-zinc-900'
                                    }`}
                            >
                                <div className={`text-xs font-semibold mb-1 ${isTodayDate
                                    ? 'bg-sky-500 text-white w-6 h-6 rounded-full flex items-center justify-center'
                                    : isCurrentMonth ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'
                                    }`}>
                                    {format(day, 'd')}
                                </div>

                                {/* Holidays */}
                                {dayHolidays.map(h => (
                                    <div key={h.id} className="text-[10px] px-1.5 py-0.5 rounded mb-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 truncate">
                                        🎉 {h.name}
                                    </div>
                                ))}

                                {/* Leave chips */}
                                {dayLeave.slice(0, 3).map(emp => (
                                    <div
                                        key={emp.id}
                                        className={`text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate ${getLeaveColor(emp.leaveType)}`}
                                        title={`${emp.name} - ${emp.leaveType}`}
                                    >
                                        {emp.name}
                                    </div>
                                ))}
                                {dayLeave.length > 3 && (
                                    <div className="text-[10px] text-zinc-400 pl-1">
                                        +{dayLeave.length - 3} more
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-zinc-500 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Legend:</span>
                {Object.entries(leaveTypeColors).map(([type, cls]) => (
                    <span key={type} className="flex items-center gap-1">
                        <span className={`inline-block w-3 h-3 rounded ${cls.split(' ')[0]}`} />
                        {type.replace(/_/g, ' ')}
                    </span>
                ))}
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-emerald-100" />
                    Holiday
                </span>
            </div>

            {/* Holiday List */}
            {holidays.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Holidays This Month</h3>
                    <div className="space-y-2">
                        {holidays.filter(h => h.date.startsWith(format(currentMonth, 'yyyy-MM'))).map(h => (
                            <div key={h.id} className="flex items-center justify-between text-sm">
                                <span>{h.name}</span>
                                <span className="text-zinc-500">{format(new Date(h.date), 'MMM d, yyyy')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
