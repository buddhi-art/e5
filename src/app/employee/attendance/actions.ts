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
