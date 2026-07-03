-- Rollback Migration 025
SET search_path = public;

DROP INDEX IF EXISTS idx_tasks_assigned_status;
DROP INDEX IF EXISTS idx_leave_requests_user_status;

DROP TABLE IF EXISTS app_config;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('mark-overdue-invoices-daily');
  END IF;
END $$;
