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

export async function approveLeave(requestId: string, notes?: string) {
  const supabase = await createClient()
  const user = await checkAdmin(supabase)
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      review_notes: notes || null
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  revalidatePath('/admin/leave')
  revalidatePath('/admin/leave/requests')
  return { success: true }
}

export async function rejectLeave(requestId: string, notes: string) {
  const supabase = await createClient()
  const user = await checkAdmin(supabase)
  if (!user) return { error: 'Unauthorized' }

  const { data: request } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'Request not found' }

  // Refund the balance since it was optimistically decremented on submit
  const currentYear = new Date(request.start_date).getFullYear()
  const { data: balance } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', request.user_id)
    .eq('leave_type_id', request.leave_type_id)
    .eq('year', currentYear)
    .single()

  if (balance) {
    await supabase
      .from('leave_balances')
      .update({ used_days: Number(balance.used_days) - Number(request.total_days) })
      .eq('id', balance.id)
  }

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      review_notes: notes
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  revalidatePath('/admin/leave')
  revalidatePath('/admin/leave/requests')
  return { success: true }
}

export async function adjustLeaveBalance(userId: string, leaveTypeId: string, newTotalDays: number, year: number) {
  const supabase = await createClient()
  const user = await checkAdmin(supabase)
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('leave_balances')
    .update({ total_days: newTotalDays })
    .match({ user_id: userId, leave_type_id: leaveTypeId, year })

  if (error) return { error: error.message }

  revalidatePath('/admin/leave/balances')
  return { success: true }
}

export async function seedLeaveBalances(year: number) {
  const supabase = await createClient()
  const user = await checkAdmin(supabase)
  if (!user) return { error: 'Unauthorized' }

  // Fetch all active employees
  const { data: employees } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'employee')
    .is('deleted_at', null)

  if (!employees || employees.length === 0) return { error: 'No employees found' }

  // Fetch all leave types
  const { data: leaveTypes } = await supabase
    .from('leave_types')
    .select('*')

  if (!leaveTypes) return { error: 'No leave types found' }

  let count = 0
  for (const emp of employees) {
    for (const type of leaveTypes) {
      // Upsert: Try to fetch existing
      const { data: existing } = await supabase
        .from('leave_balances')
        .select('id')
        .match({ user_id: emp.id, leave_type_id: type.id, year })
        .single()

      if (!existing) {
        await supabase
          .from('leave_balances')
          .insert({
            user_id: emp.id,
            leave_type_id: type.id,
            year,
            total_days: type.default_days_per_year,
            used_days: 0
          })
        count++
      }
    }
  }

  revalidatePath('/admin/leave/balances')
  return { success: true, count }
}
