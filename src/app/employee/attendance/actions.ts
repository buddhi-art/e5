'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function checkIn() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  try {
    const { error } = await supabase.from('attendance').insert({
      user_id: user.id,
      date: today,
      status: 'present',
      check_in_time: now,
    })

    if (error) {
      if (error.code === '23505') {
        return { error: 'You have already checked in today.' }
      }
      return { error: error.message }
    }

    revalidatePath('/employee/attendance')
    return { success: true, checkInTime: now }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function checkOut(daySummary: string) {
  if (!daySummary || daySummary.trim().split(/\s+/).filter(Boolean).length < 20) {
    return { error: 'Please write a day summary of at least 20 words describing what you did today.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  try {
    const { data: record, error: fetchErr } = await supabase
      .from('attendance')
      .select('id, check_in_time, check_out_time')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()

    if (fetchErr) return { error: fetchErr.message }

    if (!record) {
      return { error: 'You must check in first before checking out.' }
    }

    if (record.check_out_time) {
      return { error: 'You have already checked out today.' }
    }

    const { error } = await supabase
      .from('attendance')
      .update({ check_out_time: now, day_summary: daySummary.trim() })
      .eq('id', record.id)

    if (error) return { error: error.message }

    revalidatePath('/employee/attendance')
    return { success: true, checkOutTime: now }
  } catch (err: any) {
    return { error: err.message }
  }
}
