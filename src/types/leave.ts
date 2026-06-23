export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveType {
  id: string
  name: string
  description: string | null
  is_paid: boolean
  default_days_per_year: number
  created_at: string
}

export interface LeaveBalance {
  id: string
  user_id: string
  leave_type_id: string
  total_days: number
  used_days: number
  remaining_days: number
  year: number
}

export interface LeaveRequest {
  id: string
  user_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: LeaveStatus
  reviewed_by: string | null
  review_notes: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Holiday {
  id: string
  name: string
  date: string
  is_recurring: boolean
  created_at: string
}
