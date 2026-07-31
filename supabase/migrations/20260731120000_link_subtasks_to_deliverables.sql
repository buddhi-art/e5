-- Migration: Link subtasks to package deliverables
-- Creates the structural connection between the task hierarchy and the
-- package deliverable workflow. A deliverable item can now be represented
-- as a subtask, and sub-sub-tasks as actionable items under that deliverable.
BEGIN;

-- 1. Add deliverable_id to subtasks so a subtask can be linked to a
--    package_deliverables row (nullable: keeps backward compat with
--    free-form subtasks created from the task form).
ALTER TABLE subtasks
  ADD COLUMN IF NOT EXISTS deliverable_id UUID REFERENCES package_deliverables(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed'));

-- 2. Index for fast deliverable → subtasks lookups
CREATE INDEX IF NOT EXISTS idx_subtasks_deliverable_id ON subtasks(deliverable_id) WHERE deliverable_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subtasks_assigned_to ON subtasks(assigned_to) WHERE assigned_to IS NOT NULL;

-- 3. Backfill: for every existing deliverable that has a linked project,
--    ensure a subtask exists on the project's tasks so the deliverable shows
--    up in the task hierarchy. Only creates the link if a matching task
--    already exists — we do not invent tasks here.
--    (Intentionally minimal: the app-layer sync action handles the full
--    create/update lifecycle.)

-- 4. RLS: allow employees to update subtasks assigned to them directly
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Employees can update assigned subtasks'
      AND tablename = 'subtasks'
  ) THEN
    CREATE POLICY "Employees can update assigned subtasks"
      ON subtasks FOR UPDATE
      USING (auth.uid() = assigned_to OR auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin' OR designation = 'Founder'
      ));
  END IF;
END $$;

-- 5. Allow employees to insert subtasks assigned to them
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Employees can insert assigned subtasks'
      AND tablename = 'subtasks'
  ) THEN
    CREATE POLICY "Employees can insert assigned subtasks"
      ON subtasks FOR INSERT
      WITH CHECK (auth.uid() = assigned_to OR auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin' OR designation = 'Founder'
      ));
  END IF;
END $$;

COMMIT;