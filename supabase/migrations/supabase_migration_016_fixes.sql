-- 1. Invoice Number Sequence & Generation
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number(p_year text)
RETURNS text AS $$
DECLARE
  next_val integer;
BEGIN
  next_val := nextval('invoice_number_seq');
  RETURN 'INV-' || p_year || '-' || LPAD(next_val::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 2. Atomic Equipment Checkout RPC
CREATE OR REPLACE FUNCTION checkout_equipment(
  p_equipment_id uuid,
  p_checked_out_by uuid,
  p_expected_return_at timestamp with time zone,
  p_project_id uuid,
  p_condition text,
  p_notes text
)
RETURNS void AS $$
BEGIN
  UPDATE equipment
  SET status = 'checked_out'
  WHERE id = p_equipment_id AND status = 'available';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Equipment is not available for checkout';
  END IF;

  INSERT INTO equipment_checkouts (
    equipment_id,
    checked_out_by,
    expected_return_at,
    project_id,
    condition_at_checkout,
    notes
  ) VALUES (
    p_equipment_id,
    p_checked_out_by,
    p_expected_return_at,
    p_project_id,
    p_condition,
    p_notes
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON tasks(status, deadline);
CREATE INDEX IF NOT EXISTS idx_invoices_status_issue_date ON invoices(status, issue_date);

-- 4. Dashboard Metrics RPC
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
    'totalEmployees', (SELECT count(*) FROM profiles WHERE role = 'employee' AND deleted_at IS NULL),
    'oldEmployeeCount', (SELECT count(*) FROM profiles WHERE role = 'employee' AND deleted_at IS NULL AND created_at < p_thirty_days_ago),
    'clientCount', (SELECT count(*) FROM clients),
    'activeProjectCount', (SELECT count(*) FROM projects WHERE status != 'completed'),
    'allProjectsCount', (SELECT count(*) FROM projects),
    'recentTasks', (
       SELECT COALESCE(json_agg(t), '[]'::json)
       FROM (
         SELECT t.id, t.title, t.status, t.created_at,
                (SELECT json_build_object('full_name', p.full_name) FROM profiles p WHERE p.id = t.assigned_to) as profiles,
                (SELECT json_build_object('title', pr.title, 'clients', (SELECT json_build_object('company_name', c.company_name) FROM clients c WHERE c.id = pr.client_id)) FROM projects pr WHERE pr.id = t.project_id) as projects
         FROM tasks t
         ORDER BY t.created_at DESC LIMIT 5
       ) t
    ),
    'todayAttendance', (
       SELECT COALESCE(json_agg(a), '[]'::json)
       FROM (
         SELECT a.id, a.created_at, a.status,
                (SELECT json_build_object('full_name', p.full_name) FROM profiles p WHERE p.id = a.user_id) as profiles
         FROM attendance a
         WHERE a.date = p_today AND a.status != 'absent' AND a.status != 'on_leave'
         ORDER BY a.created_at DESC
       ) a
    ),
    'yesterdayPresent', (SELECT count(*) FROM attendance WHERE date = p_yesterday AND (status = 'present' OR status = 'late')),
    'last30DaysAttendance', (
       SELECT COALESCE(json_agg(json_build_object('date', date, 'status', status)), '[]'::json)
       FROM attendance WHERE date >= p_thirty_days_ago::date AND date <= p_today
    ),
    'todayAllAttendance', (
       SELECT COALESCE(json_agg(json_build_object('status', status)), '[]'::json)
       FROM attendance WHERE date = p_today
    ),
    'pendingTasks', (SELECT count(*) FROM tasks WHERE status = 'pending'),
    'inProgressTasks', (SELECT count(*) FROM tasks WHERE status = 'in_progress'),
    'completedTasks', (SELECT count(*) FROM tasks WHERE status = 'completed'),
    'overdueTasks', (SELECT count(*) FROM tasks WHERE deadline < p_today::timestamp with time zone AND status != 'completed'),
    'invoicesData', (
       SELECT COALESCE(json_agg(json_build_object('status', status, 'grand_total', grand_total, 'paid_amount', paid_amount)), '[]'::json)
       FROM invoices WHERE deleted_at IS NULL
    ),
    'thisMonthInvoices', (
       SELECT COALESCE(json_agg(json_build_object('grand_total', grand_total, 'status', status)), '[]'::json)
       FROM invoices WHERE deleted_at IS NULL AND issue_date >= p_start_month AND issue_date <= p_end_month AND status != 'cancelled' AND status != 'draft'
    ),
    'lastMonthInvoices', (
       SELECT COALESCE(json_agg(json_build_object('grand_total', grand_total, 'status', status)), '[]'::json)
       FROM invoices WHERE deleted_at IS NULL AND issue_date >= (p_start_month - interval '1 month')::date AND issue_date < p_start_month AND status != 'cancelled' AND status != 'draft'
    ),
    'expensesData', (
       SELECT COALESCE(json_agg(json_build_object('amount', amount)), '[]'::json)
       FROM expenses WHERE deleted_at IS NULL
    ),
    'projectBudgets', (
       SELECT COALESCE(json_agg(json_build_object('budget_amount', budget_amount)), '[]'::json)
       FROM project_budgets
    ),
    'pendingExpenses', (SELECT count(*) FROM expenses WHERE status = 'pending' AND deleted_at IS NULL),
    'pendingLeaveRequests', (SELECT count(*) FROM leave_requests WHERE status = 'pending' AND deleted_at IS NULL),
    'equipmentAvailable', (SELECT count(*) FROM equipment WHERE status = 'available' AND deleted_at IS NULL),
    'equipmentCheckedOut', (SELECT count(*) FROM equipment WHERE status = 'checked_out' AND deleted_at IS NULL),
    'equipmentInMaintenance', (SELECT count(*) FROM equipment WHERE status = 'maintenance' AND deleted_at IS NULL),
    'leaveRequestsToday', (
       SELECT COALESCE(json_agg(json_build_object('id', id)), '[]'::json)
       FROM leave_requests WHERE status = 'approved' AND deleted_at IS NULL AND start_date <= p_today AND end_date >= p_today
    ),
    'totalMeetings', (SELECT count(*) FROM client_meetings),
    'totalLeaveRequests', (SELECT count(*) FROM leave_requests WHERE deleted_at IS NULL),
    'completedTasksThisMonth', (SELECT count(*) FROM tasks WHERE status = 'completed' AND created_at >= p_start_month::timestamp with time zone AND created_at <= p_end_month::timestamp with time zone),
    'tasksThisMonth', (SELECT count(*) FROM tasks WHERE created_at >= p_start_month::timestamp with time zone AND created_at <= p_end_month::timestamp with time zone),
    'invoicesThisMonthData', (
       SELECT COALESCE(json_agg(json_build_object('status', status)), '[]'::json)
       FROM invoices WHERE deleted_at IS NULL AND issue_date >= p_start_month AND issue_date <= p_end_month
    ),
    'meetingsThisMonthCount', (SELECT count(*) FROM client_meetings WHERE meeting_date >= p_start_month AND meeting_date <= p_end_month),
    'activeClients', (
       SELECT count(DISTINCT client_id)
       FROM projects WHERE status != 'completed' AND status != 'on_hold'
    ),
    'projectsStatus', (
       SELECT COALESCE(json_agg(json_build_object('status', status)), '[]'::json)
       FROM projects
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
