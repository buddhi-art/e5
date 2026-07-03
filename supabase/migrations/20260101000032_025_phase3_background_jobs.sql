-- Migration 025: Phase 3 — Background Jobs & Cache Driver
-- Hardens pg_cron registration, adds cache driver config
-- Re-runnable: uses CREATE OR REPLACE / IF NOT EXISTS throughout
SET search_path = public;

-- =============================================================================
-- 1. Harden mark_overdue_invoices pg_cron registration
--    The existing function from migration 022 is fine — we just ensure
--    the cron job is registered even if migration 022's DO block didn't
--    fire (e.g. pg_cron was installed later).
-- =============================================================================
DO $cron_check$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.unschedule('mark-overdue-invoices-daily');
    PERFORM cron.schedule(
      'mark-overdue-invoices-daily',
      '0 2 * * *',
      $$SELECT mark_overdue_invoices()$$
    );
  END IF;
END $cron_check$;

-- =============================================================================
-- 2. Cache driver config table
-- =============================================================================
CREATE TABLE IF NOT EXISTS app_config (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

INSERT INTO app_config (key, value)
VALUES ('cache_driver', COALESCE(current_setting('app.cache_driver', true), 'auto'))
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- 3. Indexes to speed up notification queries
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_status
  ON leave_requests(user_id, status)
  WHERE deleted_at IS NULL;

-- Note: tasks table doesn't have deleted_at column, so we can't filter on it
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status
  ON tasks(assigned_to, status)
  WHERE status != 'completed';
