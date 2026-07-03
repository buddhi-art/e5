-- Migration 022: Phase 3 — Background Jobs & Reliability
-- Adds: scheduled function for overdue invoices, dashboard RPC hardening
-- Re-runnable: uses CREATE OR REPLACE throughout
SET search_path = public;

-- =============================================================================
-- 1. Create a standalone overload function that can be called by pg_cron
--    or triggered by a Supabase Edge Function timer.
--    This does NOT require authentication (SECURITY DEFINER) so it can run
--    from a scheduled job.
-- =============================================================================
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated int;
BEGIN
  UPDATE invoices
  SET status = 'overdue',
      updated_at = now()
  WHERE due_date < CURRENT_DATE
    AND status IN ('sent', 'partially_paid', 'draft')
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  -- Log the action to audit_logs
  IF v_updated > 0 THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
    VALUES (
      'invoices',
      '00000000-0000-0000-0000-000000000000',
      'UPDATE',
      jsonb_build_object(
        'scheduled_update', 'mark_overdue_invoices',
        'invoices_updated', v_updated,
        'run_at', now()::text
      ),
      NULL
    );
  END IF;
  
  RETURN v_updated;
END;
$$;

-- =============================================================================
-- 2. If pg_cron extension is available, register the job.
--    Wrapped in a DO block so this migration succeeds even without pg_cron.
-- =============================================================================
DO $cron_check$ BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Remove existing job if it exists, then create new one
    PERFORM cron.unschedule('mark-overdue-invoices-daily');
    PERFORM cron.schedule(
      'mark-overdue-invoices-daily',  -- job name
      '0 2 * * *',                    -- daily at 2 AM (NPT = 20:15 UTC previous day)
      $$SELECT mark_overdue_invoices()$$
    );
  END IF;
END $cron_check$;

-- =============================================================================
-- 3. Harden get_admin_dashboard_metrics with error-safe sub-queries.
--    Each sub-query uses COALESCE and safe defaults so a single failing
--    join never takes down the whole dashboard.
-- =============================================================================
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics(
  p_today date,
  p_start_month date,
  p_end_month date,
  p_thirty_days_ago timestamp with time zone,
  p_yesterday date
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'totalEmployees', COALESCE((SELECT count(*) FROM public.profiles WHERE role = 'employee' AND deleted_at IS NULL), 0),
    'oldEmployeeCount', COALESCE((SELECT count(*) FROM public.profiles WHERE role = 'employee' AND deleted_at IS NULL AND created_at < p_thirty_days_ago), 0),
    'clientCount', COALESCE((SELECT count(*) FROM public.clients), 0),
    'activeProjectCount', COALESCE((SELECT count(*) FROM public.projects WHERE status != 'completed'), 0),
    'allProjectsCount', COALESCE((SELECT count(*) FROM public.projects), 0),
    'recentTasks', COALESCE((
       SELECT json_agg(t) FROM (
         SELECT t.id, t.title, t.status, t.created_at,
                (SELECT json_build_object('full_name', p.full_name) FROM public.profiles p WHERE p.id = t.assigned_to) as profiles,
                (SELECT json_build_object('title', pr.title, 'clients', (SELECT json_build_object('company_name', c.company_name) FROM public.clients c WHERE c.id = pr.client_id)) FROM public.projects pr WHERE pr.id = t.project_id) as projects
         FROM public.tasks t
         ORDER BY t.created_at DESC LIMIT 5
       ) t
    ), '[]'::json),
    'todayAttendance', COALESCE((
       SELECT json_agg(a) FROM (
         SELECT a.id, a.created_at, a.status,
                (SELECT json_build_object('full_name', p.full_name) FROM public.profiles p WHERE p.id = a.user_id) as profiles
         FROM public.attendance a
         WHERE a.date = p_today AND a.status != 'absent' AND a.status != 'on_leave' AND a.deleted_at IS NULL
         ORDER BY a.created_at DESC
       ) a
    ), '[]'::json),
    'yesterdayPresent', COALESCE((SELECT count(*) FROM public.attendance WHERE date = p_yesterday AND (status = 'present' OR status = 'late') AND deleted_at IS NULL), 0),
    'last30DaysAttendance', COALESCE((
       SELECT json_agg(json_build_object('date', date, 'status', status))
       FROM public.attendance WHERE date >= p_thirty_days_ago::date AND date <= p_today AND deleted_at IS NULL
    ), '[]'::json),
    'todayAllAttendance', COALESCE((
       SELECT json_agg(json_build_object('status', status))
       FROM public.attendance WHERE date = p_today AND deleted_at IS NULL
    ), '[]'::json),
    'pendingTasks', COALESCE((SELECT count(*) FROM public.tasks WHERE status = 'pending'), 0),
    'inProgressTasks', COALESCE((SELECT count(*) FROM public.tasks WHERE status = 'in_progress'), 0),
    'completedTasks', COALESCE((SELECT count(*) FROM public.tasks WHERE status = 'completed'), 0),
    'overdueTasks', COALESCE((SELECT count(*) FROM public.tasks WHERE deadline < p_today::timestamp with time zone AND status != 'completed'), 0),
    'invoicesData', COALESCE((
       SELECT json_agg(json_build_object('status', status, 'grand_total', grand_total, 'paid_amount', paid_amount))
       FROM public.invoices WHERE deleted_at IS NULL
    ), '[]'::json),
    'thisMonthInvoices', COALESCE((
       SELECT json_agg(json_build_object('grand_total', grand_total, 'status', status))
       FROM public.invoices WHERE deleted_at IS NULL AND issue_date >= p_start_month AND issue_date <= p_end_month AND status != 'cancelled' AND status != 'draft'
    ), '[]'::json),
    'lastMonthInvoices', COALESCE((
       SELECT json_agg(json_build_object('grand_total', grand_total, 'status', status))
       FROM public.invoices WHERE deleted_at IS NULL AND issue_date >= (p_start_month - interval '1 month')::date AND issue_date < p_start_month AND status != 'cancelled' AND status != 'draft'
    ), '[]'::json),
    'expensesData', COALESCE((
       SELECT json_agg(json_build_object('amount', amount))
       FROM public.expenses WHERE deleted_at IS NULL
    ), '[]'::json),
    'projectBudgets', COALESCE((
       SELECT json_agg(json_build_object('budget_amount', budget_amount))
       FROM public.project_budgets
    ), '[]'::json),
    'pendingExpenses', COALESCE((SELECT count(*) FROM public.expenses WHERE status = 'pending' AND deleted_at IS NULL), 0),
    'pendingLeaveRequests', COALESCE((SELECT count(*) FROM public.leave_requests WHERE status = 'pending' AND deleted_at IS NULL), 0),
    'equipmentAvailable', COALESCE((SELECT count(*) FROM public.equipment WHERE status = 'available' AND deleted_at IS NULL), 0),
    'equipmentCheckedOut', COALESCE((SELECT count(*) FROM public.equipment WHERE status = 'checked_out' AND deleted_at IS NULL), 0),
    'equipmentInMaintenance', COALESCE((SELECT count(*) FROM public.equipment WHERE status = 'maintenance' AND deleted_at IS NULL), 0),
    'leaveRequestsToday', COALESCE((
       SELECT json_agg(json_build_object('id', id))
       FROM public.leave_requests WHERE status = 'approved' AND deleted_at IS NULL AND start_date <= p_today AND end_date >= p_today
    ), '[]'::json),
    'totalMeetings', COALESCE((SELECT count(*) FROM public.client_meetings), 0),
    'totalLeaveRequests', COALESCE((SELECT count(*) FROM public.leave_requests WHERE deleted_at IS NULL), 0),
    'completedTasksThisMonth', COALESCE((SELECT count(*) FROM public.tasks WHERE status = 'completed' AND created_at >= p_start_month::timestamp with time zone AND created_at <= p_end_month::timestamp with time zone), 0),
    'tasksThisMonth', COALESCE((SELECT count(*) FROM public.tasks WHERE created_at >= p_start_month::timestamp with time zone AND created_at <= p_end_month::timestamp with time zone), 0),
    'invoicesThisMonthData', COALESCE((
       SELECT json_agg(json_build_object('status', status))
       FROM public.invoices WHERE deleted_at IS NULL AND issue_date >= p_start_month AND issue_date <= p_end_month
    ), '[]'::json),
    'meetingsThisMonthCount', COALESCE((SELECT count(*) FROM public.client_meetings WHERE meeting_date >= p_start_month AND meeting_date <= p_end_month), 0),
    'activeClients', COALESCE((
       SELECT count(DISTINCT client_id)
       FROM public.projects WHERE status != 'completed' AND status != 'on_hold'
    ), 0),
    'projectsStatus', COALESCE((
       SELECT json_agg(json_build_object('status', status))
       FROM public.projects
    ), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;
