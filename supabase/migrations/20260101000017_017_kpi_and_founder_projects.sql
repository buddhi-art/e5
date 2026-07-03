-- Migration 017: Employee KPI Scoring + Founder Project CRUD
-- Re-runnable: uses IF NOT EXISTS / CREATE OR REPLACE throughout
SET search_path = public;

-- ============================================================
-- SECTION 0: Ensure tables and columns that later code depends
-- on exist.  Wrapped in existence checks so this migration
-- can be run standalone in the SQL editor without prior
-- migrations.
-- ============================================================
DO $$ BEGIN
  -- Ensure the user_role enum exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'employee');
  END IF;

  -- Ensure the employee_designation enum exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_designation') THEN
    CREATE TYPE employee_designation AS ENUM ('administration', 'scripting', 'videography', 'editing', 'model/actor');
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'employee';
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designation text;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;
  END IF;
END $$;

-- ============================================================
-- SECTION 1: Shared auth helper
-- (returns false if profiles table doesn't exist — caller
--  gracefully handles no data)
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin_or_founder(uid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_result boolean;
BEGIN
  -- Check if the role column exists; if not, fall back to designation only
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = uid
        AND deleted_at IS NULL
        AND (role = 'admin' OR designation = 'Founder')
    ) INTO v_result;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = uid
        AND deleted_at IS NULL
        AND designation = 'Founder'
    ) INTO v_result;
  END IF;
  RETURN COALESCE(v_result, false);
END;
$$;

-- ============================================================
-- SECTION 2: tasks.completed_at column
-- (already handled via DO block in SECTION 0, but keep this
--  standalone ALTER in case DO block failed silently)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;
  END IF;
END $$;

-- ============================================================
-- SECTION 3: KPI calculation RPC
-- ============================================================
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
    AND date >= v_cutoff::date;

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

-- ============================================================
-- SECTION 4: KPI breakdown RPC (returns JSON for UI)
-- ============================================================
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
  WHERE user_id = p_employee_id AND date >= v_cutoff::date;

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

-- ============================================================
-- SECTION 5: Snapshot table for cached monthly KPI scores
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_kpi_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period text NOT NULL,
  score numeric(5,2) NOT NULL,
  breakdown jsonb,
  computed_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, period)
);

-- RLS: only admin/founder can SELECT
ALTER TABLE employee_kpi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/founder can view KPI snapshots"
  ON employee_kpi_snapshots
  FOR SELECT
  USING (is_admin_or_founder(auth.uid()));

-- No INSERT/UPDATE/DELETE policies — only security definer RPCs write to this table

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_employee_period
  ON employee_kpi_snapshots(employee_id, period);

-- ============================================================
-- SECTION 6: Batch recompute RPC
-- ============================================================
CREATE OR REPLACE FUNCTION recompute_all_kpis(p_period text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period text;
  v_emp record;
  v_score numeric;
  v_breakdown json;
BEGIN
  IF NOT is_admin_or_founder(auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied' USING HINT = 'Only admins and founders can recompute KPIs';
  END IF;

  -- Default period: current YYYY-MM
  v_period := COALESCE(p_period, to_char(now(), 'YYYY-MM'));

  FOR v_emp IN
    SELECT id FROM profiles
    WHERE role = 'employee' AND deleted_at IS NULL
  LOOP
    v_score := calculate_employee_kpi(v_emp.id);
    v_breakdown := get_employee_kpi_breakdown(v_emp.id);

    INSERT INTO employee_kpi_snapshots (employee_id, period, score, breakdown)
    VALUES (v_emp.id, v_period, v_score, v_breakdown)
    ON CONFLICT (employee_id, period)
    DO UPDATE SET
      score = EXCLUDED.score,
      breakdown = EXCLUDED.breakdown,
      computed_at = now();
  END LOOP;
END;
$$;

-- ============================================================
-- SECTION 7: Extend projects RLS for founders
-- ============================================================
-- Replace existing admin-only policies with is_admin_or_founder() policies
-- We drop the old ones and create new ones that include founders.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
    DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
    DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

    CREATE POLICY "Admin/founder can insert projects"
      ON public.projects FOR INSERT
      WITH CHECK (is_admin_or_founder(auth.uid()));

    CREATE POLICY "Admin/founder can update projects"
      ON public.projects FOR UPDATE
      USING (is_admin_or_founder(auth.uid()));

    CREATE POLICY "Admin/founder can delete projects"
      ON public.projects FOR DELETE
      USING (is_admin_or_founder(auth.uid()));
  END IF;
END $$;
