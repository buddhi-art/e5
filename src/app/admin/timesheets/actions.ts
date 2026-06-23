'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function approveTimesheet(timesheetId: string) {
  const supabase = await createClient()
  const user = await checkAdmin(supabase)
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('timesheets')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', timesheetId)

  if (error) return { error: error.message }

  revalidatePath('/admin/timesheets')
  return { success: true }
}

export async function rejectTimesheet(timesheetId: string, reason: string) {
  const supabase = await createClient()
  const user = await checkAdmin(supabase)
  if (!user) return { error: 'Unauthorized' }

  if (!reason) return { error: 'Rejection reason is required' }

  const { error } = await supabase
    .from('timesheets')
    .update({
      status: 'rejected',
      notes: reason,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', timesheetId)

  if (error) return { error: error.message }

  revalidatePath('/admin/timesheets')
  return { success: true }
}
