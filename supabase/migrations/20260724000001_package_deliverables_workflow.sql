-- Migration: Multi-Portal Package Deliverables Workflow & Revision Lifecycle
BEGIN;

-- 1. Add missing columns to package_deliverables
ALTER TABLE package_deliverables 
  ADD COLUMN IF NOT EXISTS assigned_employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS drive_link TEXT,
  ADD COLUMN IF NOT EXISTS revision_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revision_history JSONB DEFAULT '[]'::jsonb;

-- 2. Drop existing CHECK constraint FIRST so updates or new inserts don't fail
ALTER TABLE package_deliverables DROP CONSTRAINT IF EXISTS package_deliverables_status_check;

-- 3. Add updated CHECK constraint supporting both new workflow statuses and legacy statuses
ALTER TABLE package_deliverables ADD CONSTRAINT package_deliverables_status_check 
  CHECK (status IN ('UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'not_started', 'in_editing', 'client_review', 'approved'));

-- 4. Migrate any existing legacy status values to new UPPERCASE format
UPDATE package_deliverables SET status = 'UNASSIGNED' WHERE status = 'not_started' OR status IS NULL;
UPDATE package_deliverables SET status = 'IN_PROGRESS' WHERE status = 'in_editing';
UPDATE package_deliverables SET status = 'UNDER_REVIEW' WHERE status = 'client_review';
UPDATE package_deliverables SET status = 'APPROVED' WHERE status = 'approved';

-- 5. Set default status to UNASSIGNED
ALTER TABLE package_deliverables ALTER COLUMN status SET DEFAULT 'UNASSIGNED';

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_package_deliverables_assigned_employee ON package_deliverables(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_package_deliverables_status ON package_deliverables(status);

COMMIT;
