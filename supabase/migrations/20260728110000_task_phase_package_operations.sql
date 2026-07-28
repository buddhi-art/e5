-- Canonical Phase 3 operations are managed from package_post_prod.
-- These fields are exposed in the Admin Task workspace as well as Package Management.
BEGIN;

ALTER TABLE package_post_prod
  ADD COLUMN IF NOT EXISTS editing_location TEXT,
  ADD COLUMN IF NOT EXISTS editing_date DATE,
  ADD COLUMN IF NOT EXISTS editing_start_time TEXT,
  ADD COLUMN IF NOT EXISTS editing_end_time TEXT;

COMMIT;
