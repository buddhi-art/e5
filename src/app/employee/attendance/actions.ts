'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markAttendance(formData: FormData) {
  const status = formData.get('status') as string

  if (!status) {
    return { error: 'Status is required' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const today = new Date().toISOString().split('T')[0]

  // Try to insert attendance for today
  const { error } = await supabase.from('attendance').insert({
    user_id: user.id,
    date: today,
    status: status,
  })

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { error: 'You have already marked your attendance for today.' }
    }
    return { error: error.message }
  }

  revalidatePath('/employee/attendance')
  return { success: true }
}
