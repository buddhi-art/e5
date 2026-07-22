'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { LeaveRequestSchema } from '@/lib/validations'

export async function requestLeave(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = LeaveRequestSchema.safeParse({
    leave_type_id: formData.get('leave_type_id'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    reason: formData.get('reason'),
  });

  if (!parsed.success) {
    return { error: 'Validation failed: ' + parsed.error.issues[0].message };
  }

  const { leave_type_id, start_date, end_date, reason } = parsed.data;

  // Calculate working days
  const start = new Date(start_date)
  const end = new Date(end_date)

  if (start > end) {
    return { error: 'Start date must be before end date' }
  }

  // Fetch holidays
  const { data: holidays } = await supabase
    .from('holidays')
    .select('date')
    .gte('date', start_date)
    .lte('date', end_date)

  const holidayDates = new Set(holidays?.map(h => h.date) || [])

  let workingDays = 0
  const current = new Date(start)
  while (current <= end) {
    const day = current.getDay()
    const dateString = current.toISOString().split('T')[0]
    // Exclude Sat (6) and Sun (0), and holidays
    if (day !== 0 && day !== 6 && !holidayDates.has(dateString)) {
      workingDays++
    }
    current.setDate(current.getDate() + 1)
  }

  if (workingDays === 0) {
    return { error: 'Request does not contain any working days' }
  }

  const currentYear = new Date().getFullYear()

  // Fetch leave balance
  const { data: balance, error: balanceError } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', user.id)
    .eq('leave_type_id', leave_type_id)
    .eq('year', currentYear)
    .single()

  if (balanceError || !balance) {
    return { error: 'Leave balance not found for this type' }
  }

  if (Number(balance.remaining_days) < workingDays) {
    return { error: `Insufficient balance. You have ${balance.remaining_days} days remaining.` }
  }

  // Insert request
  const { error: insertError } = await supabase
    .from('leave_requests')
    .insert({
      user_id: user.id,
      leave_type_id,
      start_date,
      end_date,
      total_days: workingDays,
      reason,
      status: 'pending'
    })

  if (insertError) {
    return { error: insertError.message }
  }

  // Optimistic decrement
  await supabase
    .from('leave_balances')
    .update({ used_days: Number(balance.used_days) + workingDays })
    .eq('id', balance.id)

  revalidatePath('/employee/leave')
  return { success: true }
}

export async function cancelLeave(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: request } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', requestId)
    .eq('user_id', user.id)
    .single()

  if (!request) return { error: 'Request not found' }
  if (request.status !== 'pending') return { error: 'Only pending requests can be cancelled' }

  // Refund balance
  const currentYear = new Date(request.start_date).getFullYear()
  const { data: balance } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', user.id)
    .eq('leave_type_id', request.leave_type_id)
    .eq('year', currentYear)
    .single()

  if (balance) {
    // FIX: Ensure used_days never goes negative
    const newUsedDays = Math.max(0, Number(balance.used_days) - Number(request.total_days))
    await supabase
      .from('leave_balances')
      .update({ used_days: newUsedDays })
      .eq('id', balance.id)
  }

  const { error } = await supabase
    .from('leave_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)

  if (error) return { error: error.message }

  revalidatePath('/employee/leave')
  return { success: true }
}