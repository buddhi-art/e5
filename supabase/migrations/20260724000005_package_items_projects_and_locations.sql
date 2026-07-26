-- Package item editing, manual line totals, multi-location shoots, and
-- durable links between package item units and generated projects.

BEGIN;

ALTER TABLE package_items
  ALTER COLUMN unit_cost DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

UPDATE package_items
SET total_cost = COALESCE(total_cost, subtotal, quantity * COALESCE(unit_cost, 0));

ALTER TABLE package_items
  ALTER COLUMN total_cost SET DEFAULT 0.00,
  ALTER COLUMN total_cost SET NOT NULL;

ALTER TABLE package_logistics
  ADD COLUMN IF NOT EXISTS locations TEXT[] DEFAULT '{}';

UPDATE package_logistics
SET locations = ARRAY[location_address]
WHERE location_address IS NOT NULL
  AND btrim(location_address) <> ''
  AND COALESCE(array_length(locations, 1), 0) = 0;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS package_item_id UUID REFERENCES package_items(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS package_item_unit_index INTEGER;

ALTER TABLE package_deliverables
  ADD COLUMN IF NOT EXISTS package_item_id UUID REFERENCES package_items(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS unit_index INTEGER;

CREATE INDEX IF NOT EXISTS idx_projects_package_id ON projects(package_id);
CREATE INDEX IF NOT EXISTS idx_projects_package_item_id ON projects(package_item_id);
CREATE INDEX IF NOT EXISTS idx_package_deliverables_package_item_id ON package_deliverables(package_item_id);

-- These indexes are recreated after data normalization. Dropping them makes
-- this migration safe to rerun if a previous manual execution only applied
-- part of the schema.
DROP INDEX IF EXISTS idx_projects_package_item_unit_unique;
DROP INDEX IF EXISTS idx_package_deliverables_item_unit_unique;

-- Backfill the single aggregate project/deliverable created by the previous
-- package flow as unit 01. Subsequent edits can then expand it to the full
-- quantity without creating a duplicate first project.
-- First normalize rows that may have been partially backfilled by an earlier
-- SQL-editor run. For duplicate links, retain the oldest generated link and
-- leave the other deliverables intact as custom/unlinked deliverables.
UPDATE package_deliverables
SET unit_index = 1
WHERE package_item_id IS NOT NULL
  AND unit_index IS NULL;

WITH duplicate_deliverables AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY package_item_id, unit_index
      ORDER BY created_at, id
    ) AS duplicate_rank
  FROM package_deliverables
  WHERE package_item_id IS NOT NULL
    AND unit_index IS NOT NULL
)
UPDATE package_deliverables AS deliverable
SET package_item_id = NULL,
    unit_index = NULL
FROM duplicate_deliverables AS duplicate
WHERE deliverable.id = duplicate.id
  AND duplicate.duplicate_rank > 1;

-- Pair legacy items and deliverables one-to-one by package and sort order.
-- The row numbers prevent multiple legacy deliverables with the same sort
-- order from being assigned to one package item.
WITH items_to_backfill AS (
  SELECT
    item.id,
    item.package_id,
    item.sort_order,
    row_number() OVER (
      PARTITION BY item.package_id, item.sort_order
      ORDER BY item.created_at, item.id
    ) AS item_rank
  FROM package_items AS item
  WHERE NOT EXISTS (
    SELECT 1
    FROM package_deliverables AS linked
    WHERE linked.package_item_id = item.id
  )
),
deliverables_to_backfill AS (
  SELECT
    deliverable.id,
    deliverable.package_id,
    deliverable.sort_order,
    row_number() OVER (
      PARTITION BY deliverable.package_id, deliverable.sort_order
      ORDER BY deliverable.created_at, deliverable.id
    ) AS deliverable_rank
  FROM package_deliverables AS deliverable
  WHERE deliverable.package_item_id IS NULL
),
backfill_pairs AS (
  SELECT
    item.id AS package_item_id,
    deliverable.id AS deliverable_id
  FROM items_to_backfill AS item
  JOIN deliverables_to_backfill AS deliverable
    ON deliverable.package_id = item.package_id
   AND deliverable.sort_order = item.sort_order
   AND deliverable.deliverable_rank = item.item_rank
)
UPDATE package_deliverables AS deliverable
SET package_item_id = pair.package_item_id,
    unit_index = 1
FROM backfill_pairs AS pair
WHERE deliverable.id = pair.deliverable_id;

-- Normalize any project links that already exist, preserving duplicate
-- projects as standalone records rather than deleting user data.
UPDATE projects
SET package_item_unit_index = 1
WHERE package_item_id IS NOT NULL
  AND package_item_unit_index IS NULL;

WITH duplicate_projects AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY package_item_id, package_item_unit_index
      ORDER BY created_at, id
    ) AS duplicate_rank
  FROM projects
  WHERE package_item_id IS NOT NULL
    AND package_item_unit_index IS NOT NULL
)
UPDATE projects AS project
SET package_item_id = NULL,
    package_item_unit_index = NULL
FROM duplicate_projects AS duplicate
WHERE project.id = duplicate.id
  AND duplicate.duplicate_rank > 1;

WITH project_backfill_candidates AS (
  SELECT
    project.id AS project_id,
    deliverable.package_id,
    deliverable.package_item_id,
    deliverable.unit_index,
    row_number() OVER (
      PARTITION BY project.id
      ORDER BY deliverable.created_at, deliverable.id
    ) AS candidate_rank
  FROM projects AS project
  JOIN package_deliverables AS deliverable
    ON deliverable.project_id = project.id
  WHERE deliverable.package_item_id IS NOT NULL
    AND deliverable.unit_index IS NOT NULL
    AND project.package_item_id IS NULL
)
UPDATE projects AS project
SET package_id = candidate.package_id,
    package_item_id = candidate.package_item_id,
    package_item_unit_index = candidate.unit_index
FROM project_backfill_candidates AS candidate
WHERE project.id = candidate.project_id
  AND candidate.candidate_rank = 1;

-- A final normalization pass protects against legacy project rows that point
-- to the same package item unit through different deliverables.
WITH duplicate_projects AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY package_item_id, package_item_unit_index
      ORDER BY created_at, id
    ) AS duplicate_rank
  FROM projects
  WHERE package_item_id IS NOT NULL
    AND package_item_unit_index IS NOT NULL
)
UPDATE projects AS project
SET package_item_id = NULL,
    package_item_unit_index = NULL
FROM duplicate_projects AS duplicate
WHERE project.id = duplicate.id
  AND duplicate.duplicate_rank > 1;

-- Add uniqueness only after legacy and partially migrated data is clean.
CREATE UNIQUE INDEX idx_projects_package_item_unit_unique
  ON projects(package_item_id, package_item_unit_index)
  WHERE package_item_id IS NOT NULL AND package_item_unit_index IS NOT NULL;

CREATE UNIQUE INDEX idx_package_deliverables_item_unit_unique
  ON package_deliverables(package_item_id, unit_index)
  WHERE package_item_id IS NOT NULL AND unit_index IS NOT NULL;

COMMIT;