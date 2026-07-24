-- Migration: Link Package Deliverables to Projects
BEGIN;

ALTER TABLE package_deliverables 
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_package_deliverables_project_id ON package_deliverables(project_id);

COMMIT;
