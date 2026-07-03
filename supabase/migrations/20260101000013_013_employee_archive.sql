-- E5 Chronicles - Migration 013: Employee Archive Task Cleanup
-- When an employee is archived (deleted_at set), nullify their task assignments

CREATE OR REPLACE FUNCTION public.nullify_employee_tasks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE public.tasks 
    SET assigned_to = NULL 
    WHERE assigned_to = OLD.id 
      AND status != 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_nullify_tasks_on_archive ON public.profiles;
CREATE TRIGGER trg_nullify_tasks_on_archive
  BEFORE UPDATE OF deleted_at ON public.profiles
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
  EXECUTE FUNCTION public.nullify_employee_tasks();
