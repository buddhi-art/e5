'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifyAdminOrFounder } from '@/lib/auth-utils'
import { z } from 'zod'
import { createNotification } from '@/lib/notifications'

async function checkAdmin(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
  if (!isAuthorized) return null
  return user
}

const ApproveLeaveSchema = z.object({
  requestId: z.string().uuid(),
  notes: z.string().optional(),
});

export async function approveLeave(requestId: string, notes?: string) {
  const supabase = await createClient()
  const user = await checkAdmin(supabase)
  if (!user) return { error: 'Unauthorized' }

  const parsed = ApproveLeaveSchema.safeParse({ requestId, notes: notes || undefined });
  if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message };

  const { data: request } = await supabase
    .from('leave_requests')
    .select('user_id, status')
    .eq('id', parsed.data.requestId)
    .single()

  if (!request) return { error: 'Request not found' }
  if (request.status !== 'pending') return { error: 'Only pending requests can be approved' }

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      review_notes: parsed.data.notes || null
    })
    .eq('id', parsed.data.requestId)

  if (error) return { error: error.message }

  // Notify the employee
  await createNotification(
    request.user_id,
    'leave_approved',
    'Leave Approved',
    notes || 'Your leave request has been approved.',
    '/employee/leave',
    true,
  )

  revalidatePath('/admin/leave')
  revalidatePath('/admin/leave/requests')
  return { success: true }
}

const RejectLeaveSchema = z.object({
  requestId: z.string().uuid(),
  notes: z.string().min(1, 'Rejection reason is required'),
});

export async function rejectLeave(requestId: string, notes: string) {
  const supabase = await createClient()
  const user = await checkAdmin(supabase)
  if (!user) return { error: 'Unauthorized' }

  const parsed = RejectLeaveSchema.safeParse({ requestId, notes });
  if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message };

  const { data: request } = await supabase
    .from('leave_requests')
    .select('user_id, status, start_date, leave_type_id, total_days')
    .eq('id', parsed.data.requestId)
    .single()

  if (!request) return { error: 'Request not found' }
  if (request.status !== 'pending') return { error: 'Only pending requests can be rejected' }

  const { data: rejectedRequest, error } = await supabase.rpc('reject_leave_atomic', {
    p_request_id: parsed.data.requestId,
    p_notes: parsed.data.notes,
    p_reviewer: user.id,
  })

  if (error) return { error: error.message }
  if (!rejectedRequest || rejectedRequest.length === 0) {
    return { error: 'Only pending requests can be rejected' }
  }

  // Notify the employee
  await createNotification(
    rejectedRequest[0].user_id,
    'leave_rejected',
    'Leave Rejected',
    notes,
    '/employee/leave',
    true,
  )

  revalidatePath('/admin/leave')
  revalidatePath('/admin/leave/requests')
  return { success: true }
}

const AdjustBalanceSchema = z.object({
  userId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  newTotalDays: z.number().min(0),
  year: z.number().int().min(2020).max(2100),
});

export async function adjustLeaveBalance(userId: string, leaveTypeId: string, newTotalDays: number, year: number) {
  const supabase = await createClient()
  const user = await checkAdmin(supabase)
  if (!user) return { error: 'Unauthorized' }

  const parsed = AdjustBalanceSchema.safeParse({ userId, leaveTypeId, newTotalDays, year });
  if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message };

  const { error } = await supabase
    .from('leave_balances')
    .update({ total_days: parsed.data.newTotalDays })
    .match({ user_id: parsed.data.userId, leave_type_id: parsed.data.leaveTypeId, year: parsed.data.year })

  if (error) return { error: error.message }

  revalidatePath('/admin/leave/balances')
  return { success: true }
}

export async function seedLeaveBalances(year: number) {
  const supabase = await createClient()
  const user = await checkAdmin(supabase)
  if (!user) return { error: 'Unauthorized' }

  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return { error: 'Invalid year' };
  }

  const { data: employees } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'employee')
    .is('deleted_at', null)

  if (!employees || employees.length === 0) return { error: 'No active employees found' }

  const { data: leaveTypes } = await supabase
    .from('leave_types')
    .select('id, default_days_per_year')

  if (!leaveTypes || leaveTypes.length === 0) return { error: 'No leave types found' }

  const rows = employees.flatMap((employee) => leaveTypes.map((type) => ({
    user_id: employee.id,
    leave_type_id: type.id,
    year,
    total_days: type.default_days_per_year,
    used_days: 0,
  })))
  const { data: inserted, error } = await supabase
    .from('leave_balances')
    .upsert(rows, { onConflict: 'user_id,leave_type_id,year', ignoreDuplicates: true })
    .select('id')
  if (error) return { error: error.message }
  const count = inserted?.length ?? 0

  revalidatePath('/admin/leave/balances')
  return { success: true, count }
}
