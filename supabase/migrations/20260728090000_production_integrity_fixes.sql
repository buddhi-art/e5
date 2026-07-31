-- Production integrity fixes.
-- Forward-only and safe to apply after existing migrations.
BEGIN;

-- Restore scoped task visibility after the logistics migration replaced it with USING (true).
DROP POLICY IF EXISTS "Tasks viewable by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks viewable by assigned employees and admins" ON public.tasks;
CREATE POLICY "Tasks viewable by assigned employees and admins"
  ON public.tasks FOR SELECT
  USING (
    auth.uid() = assigned_to
    OR public.is_admin_or_founder(auth.uid())
  );

-- Prevent SECURITY DEFINER functions from resolving objects through an attacker-controlled search_path.
ALTER FUNCTION public.is_admin_or_founder(uuid) SET search_path = public;
ALTER FUNCTION public.calculate_employee_kpi(uuid, integer) SET search_path = public;
ALTER FUNCTION public.atomic_talent_booking(uuid, uuid, date, date, text, numeric, text, text, text, uuid)
  SET search_path = public;

-- Atomic leave-balance reservation for a new pending request.
CREATE SEQUENCE IF NOT EXISTS public.task_number_seq;
DO $$
DECLARE
  v_max bigint;
BEGIN
  SELECT COALESCE(MAX((substring(title FROM '^E5_Task_([0-9]+)'))::bigint), 0)
  INTO v_max
  FROM public.tasks
  WHERE title ~ '^E5_Task_[0-9]+';
  PERFORM setval('public.task_number_seq', GREATEST(v_max, 1), v_max > 0);
END $$;

CREATE OR REPLACE FUNCTION public.next_task_number()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_founder(auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;
  RETURN nextval('public.task_number_seq');
END;
$$;

REVOKE ALL ON FUNCTION public.next_task_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_task_number() TO authenticated;

CREATE OR REPLACE FUNCTION public.request_leave_atomic(
  p_user_id uuid,
  p_leave_type_id uuid,
  p_start_date date,
  p_end_date date,
  p_total_days numeric,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_balance public.leave_balances%ROWTYPE;
  v_request_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;
  IF p_total_days <= 0 OR p_start_date > p_end_date THEN
    RAISE EXCEPTION 'invalid_leave_request';
  END IF;

  SELECT * INTO v_balance
  FROM public.leave_balances
  WHERE user_id = p_user_id
    AND leave_type_id = p_leave_type_id
    AND year = EXTRACT(YEAR FROM p_start_date)::integer
  FOR UPDATE;

  IF NOT FOUND OR v_balance.remaining_days < p_total_days THEN
    RAISE EXCEPTION 'insufficient_leave_balance';
  END IF;

  INSERT INTO public.leave_requests (user_id, leave_type_id, start_date, end_date, total_days, reason, status)
  VALUES (p_user_id, p_leave_type_id, p_start_date, p_end_date, p_total_days, p_reason, 'pending')
  RETURNING id INTO v_request_id;

  UPDATE public.leave_balances
  SET used_days = used_days + p_total_days
  WHERE id = v_balance.id;

  RETURN v_request_id;
END;
$$;

-- Atomic cancellation/refund. The status guard makes retries safe.
CREATE OR REPLACE FUNCTION public.cancel_leave_atomic(p_request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_request public.leave_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request
  FROM public.leave_requests
  WHERE id = p_request_id AND user_id = auth.uid()
  FOR UPDATE;
  IF NOT FOUND OR v_request.status <> 'pending' THEN
    RETURN false;
  END IF;

  UPDATE public.leave_requests SET status = 'cancelled', updated_at = now() WHERE id = p_request_id;
  UPDATE public.leave_balances
  SET used_days = GREATEST(0, used_days - v_request.total_days)
  WHERE user_id = v_request.user_id
    AND leave_type_id = v_request.leave_type_id
    AND year = EXTRACT(YEAR FROM v_request.start_date)::integer;
  RETURN true;
END;
$$;

-- Admin rejection/refund in one transaction. The pending guard makes retries safe.
CREATE OR REPLACE FUNCTION public.reject_leave_atomic(p_request_id uuid, p_notes text, p_reviewer uuid)
RETURNS TABLE (user_id uuid, total_days numeric, leave_type_id uuid, start_date date)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_request public.leave_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin_or_founder(auth.uid()) OR auth.uid() <> p_reviewer THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;
  SELECT * INTO v_request FROM public.leave_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_request.status <> 'pending' THEN
    RETURN;
  END IF;

  UPDATE public.leave_requests
  SET status = 'rejected', reviewed_by = p_reviewer, review_notes = p_notes, updated_at = now()
  WHERE id = p_request_id;
  UPDATE public.leave_balances
  SET used_days = GREATEST(0, used_days - v_request.total_days)
  WHERE user_id = v_request.user_id
    AND leave_type_id = v_request.leave_type_id
    AND year = EXTRACT(YEAR FROM v_request.start_date)::integer;

  RETURN QUERY SELECT v_request.user_id, v_request.total_days, v_request.leave_type_id, v_request.start_date;
END;
$$;

REVOKE ALL ON FUNCTION public.request_leave_atomic(uuid, uuid, date, date, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_leave_atomic(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_leave_atomic(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_leave_atomic(uuid, uuid, date, date, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_leave_atomic(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_leave_atomic(uuid, text, uuid) TO authenticated;

COMMIT;
