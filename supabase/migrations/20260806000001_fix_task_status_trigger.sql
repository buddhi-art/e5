-- Migration: Fix task_status type in trigger

CREATE OR REPLACE FUNCTION public.update_task_status_on_subtask_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_task_id uuid;
  v_total int;
  v_completed int;
  v_current_status public.task_status;
  v_new_status public.task_status;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_task_id := OLD.task_id;
  ELSE
    v_task_id := NEW.task_id;
  END IF;

  IF v_task_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Count total and completed subtasks
  SELECT count(*), count(*) FILTER (WHERE is_completed = true)
  INTO v_total, v_completed
  FROM subtasks
  WHERE task_id = v_task_id;

  -- Get current task status
  SELECT status INTO v_current_status
  FROM tasks
  WHERE id = v_task_id;

  IF v_total > 0 THEN
    IF v_completed = v_total THEN
      v_new_status := 'completed';
    ELSIF v_completed > 0 THEN
      v_new_status := 'in_progress';
    ELSE
      v_new_status := 'pending';
    END IF;
  ELSE
    -- If no subtasks, leave as is
    v_new_status := v_current_status;
  END IF;

  -- Only update if it's different to prevent unnecessary writes
  IF v_current_status IS DISTINCT FROM v_new_status THEN
    UPDATE tasks
    SET status = v_new_status,
        completed_at = CASE WHEN v_new_status = 'completed' THEN now() ELSE NULL END
    WHERE id = v_task_id;
  END IF;

  RETURN NULL;
END;
$$;
