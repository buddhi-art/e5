/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifyAdminOrFounder } from '@/lib/auth-utils'
import { z } from 'zod'
import { UuidParamSchema } from '@/lib/validations'
import { createNotification } from '@/lib/notifications'

async function checkAdmin(supabase: any) {
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
    .select('*')
    .eq('id', parsed.data.requestId)
    .single()

  if (!request) return { error: 'Request not found' }
  if (request.status !== 'pending') return { error: 'Only pending requests can be rejected' }

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
      review_notes: parsed.data.notes
    })
    .eq('id', parsed.data.requestId)

  if (error) return { error: error.message }

  // Notify the employee
  await createNotification(
    request.user_id,
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
    .select('*')

  if (!leaveTypes) return { error: 'No leave types found' }

  let count = 0
  for (const emp of employees) {
    for (const type of leaveTypes) {
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
