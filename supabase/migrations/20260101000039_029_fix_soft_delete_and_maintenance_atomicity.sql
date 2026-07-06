-- Migration 029: Fix soft-delete leakage in KPI RPCs + atomic equipment maintenance RPCs
-- Re-runnable: uses CREATE OR REPLACE throughout
SET search_path = public;

-- =============================================================================
-- 1. calculate_employee_kpi — attendance table gained `deleted_at` in migration
--    021, but this function (defined in migration 017) never filtered on it, so
--    soft-deleted attendance rows still counted toward an employee's score.
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_employee_kpi(
  p_employee_id uuid,
  p_window_days int DEFAULT 30
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_cutoff timestamptz;
  -- Attendance
  v_attendance_count int;
  v_attendance_weighted_sum numeric;
  v_attendance_score numeric;
  -- Task completion
  v_total_tasks int;
  v_completed_tasks int;
  v_task_completion_score numeric;
  -- Punctuality
  v_completed_with_deadline int;
  v_on_time_completed int;
  v_punctuality_score numeric;
  -- Final
  v_score numeric;
BEGIN
  -- Verify caller is admin/founder
  IF NOT is_admin_or_founder(auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied' USING HINT = 'Only admins and founders can view KPI data';
  END IF;

  v_cutoff := now() - (p_window_days || ' days')::interval;

  -- ── Attendance sub-score (50 pts) ──
  SELECT count(*), COALESCE(sum(
    CASE status
      WHEN 'present'   THEN 1.0
      WHEN 'late'      THEN 0.6
      WHEN 'half-day'  THEN 0.5
      WHEN 'absent'    THEN 0.0
      ELSE 0.0
    END
  ), 0)
  INTO v_attendance_count, v_attendance_weighted_sum
  FROM attendance
  WHERE user_id = p_employee_id
    AND date >= v_cutoff::date
    AND deleted_at IS NULL;

  IF v_attendance_count > 0 THEN
    v_attendance_score := 50.0 * (v_attendance_weighted_sum / v_attendance_count);
  ELSE
    v_attendance_score := 0; -- no data yet
  END IF;

  -- ── Task completion sub-score (30 pts) ──
  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'completed')
  INTO v_total_tasks, v_completed_tasks
  FROM tasks
  WHERE assigned_to = p_employee_id
    AND deadline >= v_cutoff
    AND deadline <= now();

  IF v_total_tasks > 0 THEN
    v_task_completion_score := 30.0 * (v_completed_tasks::numeric / v_total_tasks);
  ELSE
    v_task_completion_score := 0; -- no data yet
  END IF;

  -- ── Punctuality sub-score (20 pts) ──
  SELECT
    count(*),
    count(*) FILTER (WHERE completed_at IS NOT NULL AND completed_at <= deadline)
  INTO v_completed_with_deadline, v_on_time_completed
  FROM tasks
  WHERE assigned_to = p_employee_id
    AND status = 'completed'
    AND deadline IS NOT NULL
    AND deadline >= v_cutoff
    AND deadline <= now();

  IF v_completed_with_deadline > 0 THEN
    v_punctuality_score := 20.0 * (v_on_time_completed::numeric / v_completed_with_deadline);
  ELSE
    v_punctuality_score := 0; -- no data yet
  END IF;

  -- ── Final score ──
  v_score := round(v_attendance_score + v_task_completion_score + v_punctuality_score, 2);
  v_score := GREATEST(0, LEAST(100, v_score));

  RETURN v_score;
END;
$$;

-- =============================================================================
-- 2. get_employee_kpi_breakdown — same soft-delete fix as above, for the
--    attendance query feeding the UI breakdown JSON.
-- =============================================================================
CREATE OR REPLACE FUNCTION get_employee_kpi_breakdown(
  p_employee_id uuid,
  p_window_days int DEFAULT 30
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_cutoff timestamptz;
  v_attendance_count int;
  v_attendance_weighted_sum numeric;
  v_attendance_raw_pct numeric;
  v_attendance_score numeric;
  v_total_tasks int;
  v_completed_tasks int;
  v_task_completion_score numeric;
  v_completed_with_deadline int;
  v_on_time_completed int;
  v_punctuality_score numeric;
  v_total_score numeric;
  v_snap_history json;
BEGIN
  IF NOT is_admin_or_founder(auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied' USING HINT = 'Only admins and founders can view KPI data';
  END IF;

  v_cutoff := now() - (p_window_days || ' days')::interval;

  -- Attendance
  SELECT count(*), COALESCE(sum(
    CASE status
      WHEN 'present'   THEN 1.0
      WHEN 'late'      THEN 0.6
      WHEN 'half-day'  THEN 0.5
      WHEN 'absent'    THEN 0.0
      ELSE 0.0
    END
  ), 0)
  INTO v_attendance_count, v_attendance_weighted_sum
  FROM attendance
  WHERE user_id = p_employee_id AND date >= v_cutoff::date AND deleted_at IS NULL;

  IF v_attendance_count > 0 THEN
    v_attendance_raw_pct := round((v_attendance_weighted_sum / v_attendance_count) * 100, 1);
    v_attendance_score := 50.0 * (v_attendance_weighted_sum / v_attendance_count);
  ELSE
    v_attendance_raw_pct := 0;
    v_attendance_score := 0;
  END IF;

  -- Task completion
  SELECT count(*), count(*) FILTER (WHERE status = 'completed')
  INTO v_total_tasks, v_completed_tasks
  FROM tasks
  WHERE assigned_to = p_employee_id AND deadline >= v_cutoff AND deadline <= now();

  IF v_total_tasks > 0 THEN
    v_task_completion_score := 30.0 * (v_completed_tasks::numeric / v_total_tasks);
  ELSE
    v_task_completion_score := 0;
  END IF;

  -- Punctuality
  SELECT count(*), count(*) FILTER (WHERE completed_at IS NOT NULL AND completed_at <= deadline)
  INTO v_completed_with_deadline, v_on_time_completed
  FROM tasks
  WHERE assigned_to = p_employee_id AND status = 'completed' AND deadline IS NOT NULL
    AND deadline >= v_cutoff AND deadline <= now();

  IF v_completed_with_deadline > 0 THEN
    v_punctuality_score := 20.0 * (v_on_time_completed::numeric / v_completed_with_deadline);
  ELSE
    v_punctuality_score := 0;
  END IF;

  v_total_score := round(v_attendance_score + v_task_completion_score + v_punctuality_score, 2);
  v_total_score := GREATEST(0, LEAST(100, v_total_score));

  -- Snapshot history (last 6 months)
  SELECT COALESCE(json_agg(json_build_object(
    'period', period,
    'score', score,
    'computed_at', computed_at
  ) ORDER BY period DESC), '[]'::json)
  INTO v_snap_history
  FROM (
    SELECT DISTINCT ON (period) period, score, computed_at
    FROM employee_kpi_snapshots
    WHERE employee_id = p_employee_id
    ORDER BY period DESC
    LIMIT 6
  ) sub;

  RETURN json_build_object(
    'total_score', v_total_score,
    'attendance', json_build_object(
      'score', round(v_attendance_score, 2),
      'max', 50,
      'records', v_attendance_count,
      'weighted_pct', v_attendance_raw_pct
    ),
    'task_completion', json_build_object(
      'score', round(v_task_completion_score, 2),
      'max', 30,
      'completed', v_completed_tasks,
      'total', v_total_tasks
    ),
    'punctuality', json_build_object(
      'score', round(v_punctuality_score, 2),
      'max', 20,
      'on_time', v_on_time_completed,
      'completed_with_deadline', v_completed_with_deadline
    ),
    'snapshot_history', v_snap_history
  );
END;
$$;

-- =============================================================================
-- 3. update_equipment_maintenance_status — atomic replacement for the two
--    sequential UPDATEs previously done in application code (actions.ts), which
--    could leave equipment stuck in 'maintenance' if the process crashed between
--    the two writes.
-- =============================================================================
CREATE OR REPLACE FUNCTION update_equipment_maintenance_status(
  p_maintenance_id uuid,
  p_status text,
  p_completed_date date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_equipment_id uuid;
BEGIN
  -- Lock the maintenance row to prevent concurrent status changes
  SELECT equipment_id INTO v_equipment_id
  FROM equipment_maintenance
  WHERE id = p_maintenance_id
  FOR UPDATE;

  IF v_equipment_id IS NULL THEN
    RAISE EXCEPTION 'Maintenance record not found';
  END IF;

  UPDATE equipment_maintenance
  SET status = p_status,
      completed_date = CASE WHEN p_status = 'completed' THEN COALESCE(p_completed_date, CURRENT_DATE) ELSE NULL END
  WHERE id = p_maintenance_id;

  IF p_status = 'completed' THEN
    UPDATE equipment SET status = 'available', updated_at = now() WHERE id = v_equipment_id;
  ELSIF p_status = 'in_progress' THEN
    UPDATE equipment SET status = 'maintenance', updated_at = now() WHERE id = v_equipment_id;
  END IF;
END;
$$;

-- =============================================================================
-- 4. schedule_equipment_maintenance — atomic replacement for the insert +
--    conditional UPDATE previously done in application code. Locks the
--    equipment row and only flips status to 'maintenance' when it's currently
--    'available' — previously this unconditionally overwrote 'checked_out'
--    equipment to 'maintenance', corrupting its real state.
-- =============================================================================
CREATE OR REPLACE FUNCTION schedule_equipment_maintenance(
  p_equipment_id uuid,
  p_description text,
  p_scheduled_date date,
  p_vendor text DEFAULT NULL,
  p_vendor_phone text DEFAULT NULL,
  p_vendor_location text DEFAULT NULL,
  p_cost numeric DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status text;
BEGIN
  SELECT status INTO v_current_status
  FROM equipment
  WHERE id = p_equipment_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Equipment not found';
  END IF;

  INSERT INTO equipment_maintenance(
    equipment_id, description, scheduled_date, vendor, vendor_phone, vendor_location, cost, notes, status
  ) VALUES (
    p_equipment_id, p_description, p_scheduled_date, p_vendor, p_vendor_phone, p_vendor_location, p_cost, p_notes, 'scheduled'
  );

  IF p_scheduled_date <= CURRENT_DATE AND v_current_status = 'available' THEN
    UPDATE equipment SET status = 'maintenance', updated_at = now() WHERE id = p_equipment_id;
  END IF;
END;
$$;
