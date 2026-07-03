-- Migration 021: Phase 2 — Money & Data Integrity
-- Fixes: checkout_equipment RPC signature, missing columns, audit triggers,
--        storage owner-scoped RLS, deleted_at filtering, remaining Phase 1 gaps
-- Re-runnable: uses IF NOT EXISTS / DROP IF EXISTS throughout
SET search_path = public;

-- =============================================================================
-- 1. FIX: checkout_equipment RPC — merge migration 016's signature (used by
--    server actions) with migration 019's FOR UPDATE lock for atomicity.
--    Migration 019 BROKE this by rewriting it with a different param list.
--    Drop the prior signatures first: CREATE OR REPLACE cannot add/remove
--    parameter defaults on an existing function (Postgres error 42P13), and
--    migration 019's accidental overload must be removed to avoid ambiguity.
-- =============================================================================
DROP FUNCTION IF EXISTS checkout_equipment(uuid, uuid, timestamp with time zone, uuid, text, text);
DROP FUNCTION IF EXISTS checkout_equipment(uuid, uuid, uuid, date, text);
CREATE OR REPLACE FUNCTION checkout_equipment(
  p_equipment_id uuid,
  p_checked_out_by uuid,
  p_expected_return_at timestamp with time zone,
  p_project_id uuid DEFAULT NULL,
  p_condition text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status equipment_status;
BEGIN
  -- Lock the row for update to prevent concurrent checkouts
  SELECT status INTO v_status FROM equipment WHERE id = p_equipment_id FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Equipment not found';
  END IF;

  IF v_status != 'available' THEN
    RAISE EXCEPTION 'Equipment is not available for checkout (current status: %)', v_status;
  END IF;

  UPDATE equipment SET status = 'checked_out' WHERE id = p_equipment_id;

  INSERT INTO equipment_checkouts (
    equipment_id, checked_out_by, expected_return_at,
    project_id, condition_at_checkout, notes
  ) VALUES (
    p_equipment_id, p_checked_out_by, p_expected_return_at,
    p_project_id, p_condition, p_notes
  );
END;
$$;

-- =============================================================================
-- 2. FIX: Add missing columns to invoices (discount_amount, balance_due)
--    These are referenced by server actions but were never added in migrations.
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) NOT NULL DEFAULT 0;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS balance_due numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- =============================================================================
-- 3. Add deleted_at to remaining operational tables that lack it
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'talent_bookings') THEN
    ALTER TABLE talent_bookings ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipment_checkouts') THEN
    ALTER TABLE equipment_checkouts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipment_maintenance') THEN
    ALTER TABLE equipment_maintenance ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_meetings') THEN
    ALTER TABLE client_meetings ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_categories') THEN
    ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipment_categories') THEN
    ALTER TABLE equipment_categories ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'talent_types') THEN
    ALTER TABLE talent_types ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subtasks') THEN
    ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sub_subtasks') THEN
    ALTER TABLE sub_subtasks ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
    ALTER TABLE attendance ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  END IF;
END $$;

-- =============================================================================
-- 4. Add audit triggers for financial/operational tables missing them
--    (equipment_checkouts, payments, clients, project_budgets, equipment_maintenance)
-- =============================================================================
DROP TRIGGER IF EXISTS audit_equipment_checkouts_trigger ON equipment_checkouts;
CREATE TRIGGER audit_equipment_checkouts_trigger
AFTER INSERT OR UPDATE OR DELETE ON equipment_checkouts
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_equipment_maintenance_trigger ON equipment_maintenance;
CREATE TRIGGER audit_equipment_maintenance_trigger
AFTER INSERT OR UPDATE OR DELETE ON equipment_maintenance
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_clients_trigger ON clients;
CREATE TRIGGER audit_clients_trigger
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_payments_trigger ON payments;
CREATE TRIGGER audit_payments_trigger
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_project_budgets_trigger ON project_budgets;
CREATE TRIGGER audit_project_budgets_trigger
AFTER INSERT OR UPDATE OR DELETE ON project_budgets
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- =============================================================================
-- 5. FIX: Storage bucket RLS — owner-scoped access for receipts bucket
--    Previously: ANY authenticated user could view/upload ANY receipt.
--    Now: owner + admin/founder for view, owner only for upload.
-- =============================================================================
DROP POLICY IF EXISTS "Authenticated users can view receipts" ON storage.objects;
CREATE POLICY "Owner and admins can view receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      auth.uid()::text = owner_id
      OR is_admin_or_founder(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = owner_id
  );

-- =============================================================================
-- 6. FIX: RLS deleted_at filtering — employee-scoped SELECT policies must
--    exclude soft-deleted rows; admin/founder policies can see all.
-- =============================================================================

-- Expenses: employees see only non-deleted, admin/founder sees all
DROP POLICY IF EXISTS "Employees view own expenses" ON expenses;
CREATE POLICY "Employees view own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = submitted_by AND deleted_at IS NULL);

-- Timesheets: employees see only non-deleted
-- NOTE: timesheets table was dropped in migration 015, so guard with existence check
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timesheets') THEN
    DROP POLICY IF EXISTS "Employees view own timesheets" ON timesheets;
    CREATE POLICY "Employees view own timesheets"
      ON timesheets FOR SELECT
      USING (auth.uid() = user_id AND deleted_at IS NULL);
  END IF;
END $$;

-- Leave requests: employees see only non-deleted
DROP POLICY IF EXISTS "Employees view own requests" ON leave_requests;
CREATE POLICY "Employees view own requests"
  ON leave_requests FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Subtasks: add deleted_at filter for employee view
DROP POLICY IF EXISTS "Employees can view subtasks" ON subtasks;
CREATE POLICY "Employees can view subtasks"
  ON subtasks FOR SELECT
  USING (deleted_at IS NULL);

-- Sub_subtasks: add deleted_at filter for employee view
DROP POLICY IF EXISTS "Employees can view sub_subtasks" ON sub_subtasks;
DROP POLICY IF EXISTS "Employees can view sub_subtasks" ON sub_subtasks;
CREATE POLICY "Employees can view sub_subtasks"
  ON sub_subtasks FOR SELECT
  USING (deleted_at IS NULL);

-- Equipments: employee view filtered to non-deleted
DROP POLICY IF EXISTS "Employees view equipment" ON equipment;
CREATE POLICY "Employees view equipment"
  ON equipment FOR SELECT
  USING (deleted_at IS NULL);

-- Talents: employee view filtered to non-deleted
DROP POLICY IF EXISTS "Employees view talents" ON talents;
CREATE POLICY "Employees view talents"
  ON talents FOR SELECT
  USING (deleted_at IS NULL);

-- Talent bookings: employee view filtered to non-deleted
DROP POLICY IF EXISTS "Employees view bookings" ON talent_bookings;
CREATE POLICY "Employees view bookings"
  ON talent_bookings FOR SELECT
  USING (deleted_at IS NULL);

-- =============================================================================
-- 7. FIX: Add employee self-insert policy for attendance if missing
--    (migration 014 created it but ensure idempotence)
-- =============================================================================
DROP POLICY IF EXISTS "Employees can insert own attendance" ON attendance;
CREATE POLICY "Employees can insert own attendance"
  ON attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 8. FIX: Add discount_amount and balance_due to get_admin_dashboard_metrics
--    to ensure health score calculations include these fields correctly
-- =============================================================================
-- (No change needed — dashboard RPC uses grand_total, not discount_amount/balance_due)

-- =============================================================================
-- 9. Add expense_categories and equipment_categories category delete protection
--    Only allow deletion of categories that are not in use
-- =============================================================================
CREATE OR REPLACE FUNCTION prevent_delete_used_category()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'expense_categories' THEN
    IF EXISTS (SELECT 1 FROM expenses WHERE category = OLD.name AND deleted_at IS NULL LIMIT 1) THEN
      RAISE EXCEPTION 'Cannot delete expense category "%" — it is in use by existing expenses', OLD.name;
    END IF;
  ELSIF TG_TABLE_NAME = 'equipment_categories' THEN
    IF EXISTS (SELECT 1 FROM equipment WHERE category = OLD.name AND deleted_at IS NULL LIMIT 1) THEN
      RAISE EXCEPTION 'Cannot delete equipment category "%" — it is in use by existing equipment', OLD.name;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_delete_used_expense_category ON expense_categories;
CREATE TRIGGER trg_prevent_delete_used_expense_category
  BEFORE DELETE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION prevent_delete_used_category();

DROP TRIGGER IF EXISTS trg_prevent_delete_used_equipment_category ON equipment_categories;
CREATE TRIGGER trg_prevent_delete_used_equipment_category
  BEFORE DELETE ON equipment_categories
  FOR EACH ROW
  EXECUTE FUNCTION prevent_delete_used_category();
