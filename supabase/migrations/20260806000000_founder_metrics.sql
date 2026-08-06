-- Migration: Founder Dashboard Task Analytics RPC

CREATE OR REPLACE FUNCTION public.get_founder_task_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_early_count int;
  v_on_time_count int;
  v_late_count int;
  v_phase_analytics json;
BEGIN
  -- 1. Calculate task completion timeliness
  SELECT
    count(*) FILTER (WHERE completed_at < deadline),
    count(*) FILTER (WHERE completed_at::date = deadline::date),
    count(*) FILTER (WHERE completed_at > deadline AND completed_at::date != deadline::date)
  INTO
    v_early_count,
    v_on_time_count,
    v_late_count
  FROM public.tasks
  WHERE status = 'completed' AND completed_at IS NOT NULL AND deadline IS NOT NULL AND deleted_at IS NULL;

  -- 2. Calculate average phase durations
  SELECT json_agg(
    json_build_object(
      'phase', sub.phase,
      'avgDays', round(sub.avg_days::numeric, 1)
    )
  )
  INTO v_phase_analytics
  FROM (
    SELECT
      phase,
      avg(extract(epoch from (completed_at - created_at)) / 86400.0) as avg_days
    FROM public.tasks
    WHERE status = 'completed' 
      AND completed_at IS NOT NULL 
      AND created_at IS NOT NULL 
      AND phase IS NOT NULL
      AND deleted_at IS NULL
    GROUP BY phase
    ORDER BY avg_days DESC
  ) sub;

  -- Return consolidated JSON
  RETURN json_build_object(
    'earlyCount', COALESCE(v_early_count, 0),
    'onTimeCount', COALESCE(v_on_time_count, 0),
    'lateCount', COALESCE(v_late_count, 0),
    'phaseTimes', COALESCE(v_phase_analytics, '[]'::json)
  );
END;
$$;
