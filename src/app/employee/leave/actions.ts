'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { LeaveRequestSchema } from '@/lib/validations'
import { z } from 'zod'

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

  // Calculate working days using UTC to avoid timezone shifts
  const start = new Date(`${start_date}T00:00:00Z`)
  const end = new Date(`${end_date}T00:00:00Z`)

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
    const day = current.getUTCDay()
    const dateString = current.toISOString().split('T')[0]
    // Exclude Sat (6) and Sun (0), and holidays
    if (day !== 0 && day !== 6 && !holidayDates.has(dateString)) {
      workingDays++
    }
    current.setUTCDate(current.getUTCDate() + 1)
  }

  if (workingDays === 0) {
    return { error: 'Request does not contain any working days' }
  }

  const currentYear = start.getUTCFullYear()

  // Validate the balance exists before attempting the atomic reservation.
  const { data: balance, error: balanceError } = await supabase
    .from('leave_balances')
    .select('remaining_days')
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

  const { error: requestError } = await supabase.rpc('request_leave_atomic', {
    p_user_id: user.id,
    p_leave_type_id: leave_type_id,
    p_start_date: start_date,
    p_end_date: end_date,
    p_total_days: workingDays,
    p_reason: reason,
  })

  if (requestError) {
    if (requestError.message.includes('insufficient_leave_balance')) {
      return { error: 'Insufficient leave balance.' }
    }
    return { error: requestError.message }
  }

  revalidatePath('/employee/leave')
  return { success: true }
}

export async function cancelLeave(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsedRequestId = z.string().uuid().safeParse(requestId)
  if (!parsedRequestId.success) return { error: 'Invalid request ID' }

  const { data: request } = await supabase
    .from('leave_requests')
    .select('id, user_id, leave_type_id, start_date, total_days, status')
    .eq('id', parsedRequestId.data)
    .eq('user_id', user.id)
    .single()

  if (!request) return { error: 'Request not found' }
  if (request.status !== 'pending') return { error: 'Only pending requests can be cancelled' }

  const { data: cancelled, error } = await supabase.rpc('cancel_leave_atomic', {
    p_request_id: parsedRequestId.data,
  })

  if (error) return { error: error.message }
  if (!cancelled) return { error: 'Only pending requests can be cancelled' }

  revalidatePath('/employee/leave')
  return { success: true }
}