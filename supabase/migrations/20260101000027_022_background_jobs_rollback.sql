-- Rollback Migration 022: Background Jobs & Reliability
SET search_path = public;

-- 1. Remove the scheduled function
DROP FUNCTION IF EXISTS mark_overdue_invoices();

-- 2. Unschedule pg_cron job if extension exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('mark-overdue-invoices-daily');
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 3. Restore original get_admin_dashboard_metrics (pre-hardening)
-- This reverts to the migration 016 version without COALESCE hardening
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics(
  p_today date,
  p_start_month date,
  p_end_month date,
  p_thirty_days_ago timestamp with time zone,
  p_yesterday date
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'totalEmployees', (SELECT count(*) FROM public.profiles WHERE role = 'employee' AND deleted_at IS NULL),
    'oldEmployeeCount', (SELECT count(*) FROM public.profiles WHERE role = 'employee' AND deleted_at IS NULL AND created_at < p_thirty_days_ago),
    'clientCount', (SELECT count(*) FROM public.clients),
    'activeProjectCount', (SELECT count(*) FROM public.projects WHERE status != 'completed'),
    'allProjectsCount', (SELECT count(*) FROM public.projects),
    'recentTasks', (
       SELECT COALESCE(json_agg(t), '[]'::json)
       FROM (
         SELECT t.id, t.title, t.status, t.created_at,
                (SELECT json_build_object('full_name', p.full_name) FROM public.profiles p WHERE p.id = t.assigned_to) as profiles,
                (SELECT json_build_object('title', pr.title, 'clients', (SELECT json_build_object('company_name', c.company_name) FROM public.clients c WHERE c.id = pr.client_id)) FROM public.projects pr WHERE pr.id = t.project_id) as projects
         FROM public.tasks t
         ORDER BY t.created_at DESC LIMIT 5
       ) t
    ),
    'todayAttendance', (
       SELECT COALESCE(json_agg(a), '[]'::json)
       FROM (
         SELECT a.id, a.created_at, a.status,
                (SELECT json_build_object('full_name', p.full_name) FROM public.profiles p WHERE p.id = a.user_id) as profiles
         FROM public.attendance a
         WHERE a.date = p_today AND a.status != 'absent' AND a.status != 'on_leave'
         ORDER BY a.created_at DESC
       ) a
    ),
    'yesterdayPresent', (SELECT count(*) FROM public.attendance WHERE date = p_yesterday AND (status = 'present' OR status = 'late')),
    'last30DaysAttendance', (
       SELECT COALESCE(json_agg(json_build_object('date', date, 'status', status)), '[]'::json)
       FROM public.attendance WHERE date >= p_thirty_days_ago::date AND date <= p_today
    ),
    'todayAllAttendance', (
       SELECT COALESCE(json_agg(json_build_object('status', status)), '[]'::json)
       FROM public.attendance WHERE date = p_today
    ),
    'pendingTasks', (SELECT count(*) FROM public.tasks WHERE status = 'pending'),
    'inProgressTasks', (SELECT count(*) FROM public.tasks WHERE status = 'in_progress'),
    'completedTasks', (SELECT count(*) FROM public.tasks WHERE status = 'completed'),
    'overdueTasks', (SELECT count(*) FROM public.tasks WHERE deadline < p_today::timestamp with time zone AND status != 'completed'),
    'invoicesData', (
       SELECT COALESCE(json_agg(json_build_object('status', status, 'grand_total', grand_total, 'paid_amount', paid_amount)), '[]'::json)
       FROM public.invoices WHERE deleted_at IS NULL
    ),
    'thisMonthInvoices', (
       SELECT COALESCE(json_agg(json_build_object('grand_total', grand_total, 'status', status)), '[]'::json)
       FROM public.invoices WHERE deleted_at IS NULL AND issue_date >= p_start_month AND issue_date <= p_end_month AND status != 'cancelled' AND status != 'draft'
    ),
    'lastMonthInvoices', (
       SELECT COALESCE(json_agg(json_build_object('grand_total', grand_total, 'status', status)), '[]'::json)
       FROM public.invoices WHERE deleted_at IS NULL AND issue_date >= (p_start_month - interval '1 month')::date AND issue_date < p_start_month AND status != 'cancelled' AND status != 'draft'
    ),
    'expensesData', (
       SELECT COALESCE(json_agg(json_build_object('amount', amount)), '[]'::json)
       FROM public.expenses WHERE deleted_at IS NULL
    ),
    'projectBudgets', (
       SELECT COALESCE(json_agg(json_build_object('budget_amount', budget_amount)), '[]'::json)
       FROM public.project_budgets
    ),
    'pendingExpenses', (SELECT count(*) FROM public.expenses WHERE status = 'pending' AND deleted_at IS NULL),
    'pendingLeaveRequests', (SELECT count(*) FROM public.leave_requests WHERE status = 'pending' AND deleted_at IS NULL),
    'equipmentAvailable', (SELECT count(*) FROM public.equipment WHERE status = 'available' AND deleted_at IS NULL),
    'equipmentCheckedOut', (SELECT count(*) FROM public.equipment WHERE status = 'checked_out' AND deleted_at IS NULL),
    'equipmentInMaintenance', (SELECT count(*) FROM public.equipment WHERE status = 'maintenance' AND deleted_at IS NULL),
    'leaveRequestsToday', (
       SELECT COALESCE(json_agg(json_build_object('id', id)), '[]'::json)
       FROM public.leave_requests WHERE status = 'approved' AND deleted_at IS NULL AND start_date <= p_today AND end_date >= p_today
    ),
    'totalMeetings', (SELECT count(*) FROM public.client_meetings),
    'totalLeaveRequests', (SELECT count(*) FROM public.leave_requests WHERE deleted_at IS NULL),
    'completedTasksThisMonth', (SELECT count(*) FROM public.tasks WHERE status = 'completed' AND created_at >= p_start_month::timestamp with time zone AND created_at <= p_end_month::timestamp with time zone),
    'tasksThisMonth', (SELECT count(*) FROM public.tasks WHERE created_at >= p_start_month::timestamp with time zone AND created_at <= p_end_month::timestamp with time zone),
    'invoicesThisMonthData', (
       SELECT COALESCE(json_agg(json_build_object('status', status)), '[]'::json)
       FROM public.invoices WHERE deleted_at IS NULL AND issue_date >= p_start_month AND issue_date <= p_end_month
    ),
    'meetingsThisMonthCount', (SELECT count(*) FROM public.client_meetings WHERE meeting_date >= p_start_month AND meeting_date <= p_end_month),
    'activeClients', (
       SELECT count(DISTINCT client_id)
       FROM public.projects WHERE status != 'completed' AND status != 'on_hold'
    ),
    'projectsStatus', (
       SELECT COALESCE(json_agg(json_build_object('status', status)), '[]'::json)
       FROM public.projects
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
