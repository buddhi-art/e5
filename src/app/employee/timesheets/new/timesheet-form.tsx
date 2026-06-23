'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { saveTimesheet, submitTimesheet, type TimesheetEntry } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, Clock, Send, Save } from 'lucide-react'

type EntryRow = {
  id: string
  project_id: string
  task_id: string
  date: string
  hours: string
  description: string
  billable: 'billable' | 'non_billable'
}

function generateId() {
  return Math.random().toString(36).slice(2, 11)
}

function getDaysOfWeek(weekStarting: string): { date: string; label: string; dayName: string }[] {
  const days = []
  const start = new Date(weekStarting)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push({
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      dayName: dayNames[i],
    })
  }
  return days
}

export function TimesheetForm({
  weekStarting,
  existingTimesheet,
  existingEntries,
  projects,
  tasks,
}: {
  weekStarting: string
  existingTimesheet: any
  existingEntries: any[]
  projects: { id: string; title: string }[]
  tasks: { id: string; title: string; project_id: string }[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState(existingTimesheet?.notes || '')
  const [showWeekend, setShowWeekend] = useState(false)

  const days = getDaysOfWeek(weekStarting)
  const weekdays = showWeekend ? days : days.slice(0, 5)

  // Initialize entries from existing data or create empty ones for each weekday
  const initialEntries: Record<string, EntryRow[]> = {}
  for (const day of days) {
    const dayEntries = existingEntries
      .filter((e: any) => e.date === day.date)
      .map((e: any) => ({
        id: generateId(),
        project_id: e.project_id || '',
        task_id: e.task_id || '',
        date: e.date,
        hours: String(e.hours),
        description: e.description || '',
        billable: e.billable || 'billable',
      }))
    initialEntries[day.date] = dayEntries.length > 0 ? dayEntries : []
  }

  const [entries, setEntries] = useState<Record<string, EntryRow[]>>(initialEntries)

  function addEntry(date: string) {
    setEntries(prev => ({
      ...prev,
      [date]: [...(prev[date] || []), {
        id: generateId(),
        project_id: '',
        task_id: '',
        date,
        hours: '',
        description: '',
        billable: 'billable',
      }],
    }))
  }

  function removeEntry(date: string, entryId: string) {
    setEntries(prev => ({
      ...prev,
      [date]: (prev[date] || []).filter(e => e.id !== entryId),
    }))
  }

  function updateEntry(date: string, entryId: string, field: keyof EntryRow, value: string) {
    setEntries(prev => ({
      ...prev,
      [date]: (prev[date] || []).map(e => {
        if (e.id !== entryId) return e
        const updated = { ...e, [field]: value }
        // Reset task when project changes
        if (field === 'project_id') updated.task_id = ''
        return updated
      }),
    }))
  }

  // Calculate totals
  const dayTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const [date, dayEntries] of Object.entries(entries)) {
      totals[date] = dayEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0)
    }
    return totals
  }, [entries])

  const weekTotal = useMemo(() => {
    return Object.values(dayTotals).reduce((sum, h) => sum + h, 0)
  }, [dayTotals])

  const billableTotal = useMemo(() => {
    let total = 0
    for (const dayEntries of Object.values(entries)) {
      for (const e of dayEntries) {
        if (e.billable === 'billable') total += parseFloat(e.hours) || 0
      }
    }
    return total
  }, [entries])

  // Flatten all entries for submission
  function getAllEntries(): TimesheetEntry[] {
    const all: TimesheetEntry[] = []
    for (const [date, dayEntries] of Object.entries(entries)) {
      for (const e of dayEntries) {
        if (parseFloat(e.hours) > 0) {
          all.push({
            project_id: e.project_id || null,
            task_id: e.task_id || null,
            date: e.date,
            hours: parseFloat(e.hours),
            description: e.description,
            billable: e.billable,
          })
        }
      }
    }
    return all
  }

  async function handleSave() {
    setLoading(true)
    const allEntries = getAllEntries()
    if (allEntries.length === 0) {
      toast.error('Please add at least one entry with hours')
      setLoading(false)
      return
    }
    const res = await saveTimesheet(weekStarting, allEntries, notes)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Timesheet saved as draft')
      router.push('/employee/timesheets')
    }
    setLoading(false)
  }

  async function handleSubmit() {
    setLoading(true)
    const allEntries = getAllEntries()
    if (allEntries.length === 0) {
      toast.error('Please add at least one entry with hours')
      setLoading(false)
      return
    }
    // Save first, then submit
    const saveRes = await saveTimesheet(weekStarting, allEntries, notes)
    if (saveRes?.error) {
      toast.error(saveRes.error)
      setLoading(false)
      return
    }
    const submitRes = await submitTimesheet(saveRes.id!)
    if (submitRes?.error) {
      toast.error(submitRes.error)
    } else {
      toast.success('Timesheet submitted for approval')
      router.push('/employee/timesheets')
    }
    setLoading(false)
  }

  const formatWeekRange = () => {
    const start = new Date(weekStarting)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${start.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
  }

  const isReadOnly = existingTimesheet?.status === 'submitted' || existingTimesheet?.status === 'approved'

  return (
    <div className="space-y-6">
      {/* Week header */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div>
          <p className="text-sm text-zinc-500">Week of</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-white">{formatWeekRange()}</p>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{weekTotal.toFixed(1)}h</p>
            <p className="text-xs text-zinc-500">total</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-emerald-600">{billableTotal.toFixed(1)}h</p>
            <p className="text-xs text-zinc-500">billable</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-400">{(weekTotal - billableTotal).toFixed(1)}h</p>
            <p className="text-xs text-zinc-500">non-billable</p>
          </div>
        </div>
      </div>

      {/* Day-by-day entries */}
      {weekdays.map((day) => {
        const dayEntries = entries[day.date] || []
        const isWeekend = day.dayName === 'Sat' || day.dayName === 'Sun'

        return (
          <div key={day.date} className={`bg-white dark:bg-zinc-900 border rounded-xl shadow-sm overflow-hidden ${isWeekend ? 'border-zinc-200/50 dark:border-zinc-800/50 opacity-80' : 'border-zinc-200 dark:border-zinc-800'}`}>
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-zinc-900 dark:text-white w-8">{day.dayName}</span>
                <span className="text-sm text-zinc-500">{day.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />{(dayTotals[day.date] || 0).toFixed(1)}h
                </span>
                {!isReadOnly && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => addEntry(day.date)} className="text-sky-600 hover:text-sky-700 text-xs h-7">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                )}
              </div>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {dayEntries.length === 0 ? (
                <div className="px-4 py-6 text-center text-zinc-400 text-sm">
                  No entries.{' '}
                  {!isReadOnly && (
                    <button onClick={() => addEntry(day.date)} className="text-sky-500 hover:underline">Add one</button>
                  )}
                </div>
              ) : (
                dayEntries.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 grid grid-cols-12 gap-3 items-center">
                    {/* Project */}
                    <div className="col-span-3">
                      <Select value={entry.project_id} onValueChange={(v: string | null) => updateEntry(day.date, entry.id, 'project_id', v || '')} disabled={isReadOnly}>
                        <SelectTrigger className="h-9 bg-zinc-50 dark:bg-zinc-800/50 text-sm">
                          <SelectValue placeholder="Project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Task */}
                    <div className="col-span-2">
                      <Select value={entry.task_id} onValueChange={(v: string | null) => updateEntry(day.date, entry.id, 'task_id', v || '')} disabled={isReadOnly || !entry.project_id}>
                        <SelectTrigger className="h-9 bg-zinc-50 dark:bg-zinc-800/50 text-sm">
                          <SelectValue placeholder="Task" />
                        </SelectTrigger>
                        <SelectContent>
                          {tasks
                            .filter(t => t.project_id === entry.project_id)
                            .map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Hours */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        max="24"
                        value={entry.hours}
                        onChange={e => updateEntry(day.date, entry.id, 'hours', e.target.value)}
                        placeholder="Hrs"
                        className="h-9 text-sm bg-zinc-50 dark:bg-zinc-800/50 text-center"
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Billable */}
                    <div className="col-span-2">
                      <Select value={entry.billable} onValueChange={(v: string | null) => updateEntry(day.date, entry.id, 'billable', v || 'billable')} disabled={isReadOnly}>
                        <SelectTrigger className="h-9 bg-zinc-50 dark:bg-zinc-800/50 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="billable">Billable</SelectItem>
                          <SelectItem value="non_billable">Non-Billable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div className="col-span-3">
                      <Input
                        value={entry.description}
                        onChange={e => updateEntry(day.date, entry.id, 'description', e.target.value)}
                        placeholder="Notes..."
                        className="h-9 text-sm bg-zinc-50 dark:bg-zinc-800/50"
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Delete */}
                    <div className="col-span-1 flex justify-end">
                      {!isReadOnly && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry(day.date, entry.id)} className="text-red-400 hover:text-red-600 h-8 w-8 p-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}

      {/* Show/hide weekend toggle */}
      <div className="text-center">
        <button
          onClick={() => setShowWeekend(!showWeekend)}
          className="text-sm text-sky-500 hover:underline"
        >
          {showWeekend ? 'Hide weekend' : 'Show Sat & Sun'}
        </button>
      </div>

      {/* Notes */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any notes about this week..."
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          disabled={isReadOnly}
        />
      </div>

      {/* Action buttons */}
      {!isReadOnly && (
        <div className="flex gap-4 justify-end pb-8">
          <Button type="button" variant="outline" onClick={handleSave} disabled={loading} className="min-w-[140px]">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[180px]">
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </div>
      )}
    </div>
  )
}
