'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CheckOutSchema } from '@/lib/validations'

function getNepalDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kathmandu' })
}

export async function checkIn() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const today = getNepalDate()
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
  } catch (err: unknown) {
    return { error: (err instanceof Error ? err.message : String(err)) }
  }
}

export async function checkOut(daySummary: string) {
  const parsed = CheckOutSchema.safeParse({ daySummary });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const validSummary = parsed.data.daySummary;

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const today = getNepalDate()
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

    // Enforce 2-hour minimum work duration
    const checkInDate = new Date(record.check_in_time)
    const nowDate = new Date()
    const diffMs = nowDate.getTime() - checkInDate.getTime()
    const diffMinutes = diffMs / (1000 * 60)
    const MIN_WORK_MINUTES = 120 // 2 hours

    if (diffMinutes < MIN_WORK_MINUTES) {
      const remainingMins = Math.ceil(MIN_WORK_MINUTES - diffMinutes)
      const hrs = Math.floor(remainingMins / 60)
      const mins = remainingMins % 60
      return {
        error: `You cannot check out yet. Minimum 2 hours required after check-in. ${hrs > 0 ? `${hrs}h ` : ''}${mins}m remaining.`
      }
    }

    const { error } = await supabase
      .from('attendance')
      .update({ check_out_time: now, day_summary: validSummary.trim() })
      .eq('id', record.id)

    if (error) return { error: error.message }

    revalidatePath('/employee/attendance')
    return { success: true, checkOutTime: now }
  } catch (err: unknown) {
    return { error: (err instanceof Error ? err.message : String(err)) }
  }
}
