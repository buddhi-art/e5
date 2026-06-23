'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TimesheetEntry = {
  project_id: string | null
  task_id: string | null
  date: string
  hours: number
  description: string
  billable: 'billable' | 'non_billable'
}

export async function saveTimesheet(
  week_starting: string,
  entries: TimesheetEntry[],
  notes: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!week_starting) return { error: 'Week starting date is required' }
  if (entries.length === 0) return { error: 'At least one entry is required' }

  // Validate all entries have hours > 0
  for (const entry of entries) {
    if (!entry.hours || entry.hours <= 0) return { error: 'All entries must have valid hours' }
    if (!entry.date) return { error: 'All entries must have a date' }
  }

  const total_hours = entries.reduce((sum, e) => sum + Number(e.hours), 0)

  // Check if a timesheet already exists for this week
  const { data: existing } = await supabase
    .from('timesheets')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('week_starting', week_starting)
    .is('deleted_at', null)
    .single()

  let timesheet_id: string

  if (existing) {
    // Only allow editing if draft or rejected
    if (existing.status !== 'draft' && existing.status !== 'rejected') {
      return { error: 'This timesheet has already been submitted and cannot be edited.' }
    }
    // Update existing
    const { error: updateError } = await supabase
      .from('timesheets')
      .update({ total_hours, notes, updated_at: new Date().toISOString() })
      .eq('id', existing.id)

    if (updateError) return { error: updateError.message }
    timesheet_id = existing.id
  } else {
    // Insert new
    const { data: newTs, error: insertError } = await supabase
      .from('timesheets')
      .insert({ user_id: user.id, week_starting, total_hours, notes, status: 'draft' })
      .select('id')
      .single()

    if (insertError) return { error: insertError.message }
    timesheet_id = newTs.id
  }

  // Delete existing entries and re-insert
  await supabase.from('timesheet_entries').delete().eq('timesheet_id', timesheet_id)

  const { error: entriesError } = await supabase.from('timesheet_entries').insert(
    entries.map(e => ({
      timesheet_id,
      project_id: e.project_id || null,
      task_id: e.task_id || null,
      date: e.date,
      hours: e.hours,
      description: e.description || null,
      billable: e.billable,
    }))
  )

  if (entriesError) return { error: entriesError.message }

  revalidatePath('/employee/timesheets')
  return { success: true, id: timesheet_id }
}

export async function submitTimesheet(timesheetId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify it belongs to this user and is draft/rejected
  const { data: ts } = await supabase
    .from('timesheets')
    .select('id, status, user_id')
    .eq('id', timesheetId)
    .single()

  if (!ts) return { error: 'Timesheet not found' }
  if (ts.user_id !== user.id) return { error: 'Unauthorized' }
  if (ts.status !== 'draft' && ts.status !== 'rejected') {
    return { error: 'Only draft or rejected timesheets can be submitted' }
  }

  const { error } = await supabase
    .from('timesheets')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', timesheetId)

  if (error) return { error: error.message }

  revalidatePath('/employee/timesheets')
  return { success: true }
}
