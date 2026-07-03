-- Rollback Migration 021: Phase 2 — Money & Data Integrity
SET search_path = public;

-- 1. Restore old checkout_equipment (no FOR UPDATE lock — the 019 version)
CREATE OR REPLACE FUNCTION checkout_equipment(
  p_equipment_id uuid,
  p_user_id uuid,
  p_project_id uuid,
  p_expected_return_date date,
  p_purpose text
) RETURNS void AS $$
DECLARE
  v_status equipment_status;
BEGIN
  SELECT status INTO v_status FROM equipment WHERE id = p_equipment_id;
  IF v_status != 'available' THEN
    RAISE EXCEPTION 'Equipment is not available for checkout';
  END IF;
  UPDATE equipment SET status = 'in_use' WHERE id = p_equipment_id;
  INSERT INTO equipment_checkouts (equipment_id, user_id, project_id, expected_return_date, purpose)
  VALUES (p_equipment_id, p_user_id, p_project_id, p_expected_return_date, p_purpose);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Remove invoice columns (discount_amount, balance_due)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    ALTER TABLE invoices DROP COLUMN IF EXISTS discount_amount;
    ALTER TABLE invoices DROP COLUMN IF EXISTS balance_due;
  END IF;
END $$;

-- 3. Drop deleted_at columns added by this migration
ALTER TABLE talent_bookings DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE equipment_checkouts DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE equipment_maintenance DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE client_meetings DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE expense_categories DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE equipment_categories DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE talent_types DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE subtasks DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE sub_subtasks DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE attendance DROP COLUMN IF EXISTS deleted_at;

-- 4. Drop audit triggers added by this migration
DROP TRIGGER IF EXISTS audit_equipment_checkouts_trigger ON equipment_checkouts;
DROP TRIGGER IF EXISTS audit_equipment_maintenance_trigger ON equipment_maintenance;
DROP TRIGGER IF EXISTS audit_clients_trigger ON clients;
DROP TRIGGER IF EXISTS audit_payments_trigger ON payments;
DROP TRIGGER IF EXISTS audit_project_budgets_trigger ON project_budgets;

-- 5. Restore old storage policies
DROP POLICY IF EXISTS "Owner and admins can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
CREATE POLICY "Authenticated users can view receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts');
CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts');

-- 6. Restore old RLS policies
DROP POLICY IF EXISTS "Employees view own expenses" ON expenses;
CREATE POLICY "Employees view own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = submitted_by);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timesheets') THEN
    DROP POLICY IF EXISTS "Employees view own timesheets" ON timesheets;
    CREATE POLICY "Employees view own timesheets"
      ON timesheets FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DROP POLICY IF EXISTS "Employees view own requests" ON leave_requests;
CREATE POLICY "Employees view own requests"
  ON leave_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Employees can view subtasks" ON subtasks;
CREATE POLICY "Employees can view subtasks"
  ON subtasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Employees can view sub_subtasks" ON sub_subtasks;
CREATE POLICY "Employees can view sub_subtasks"
  ON sub_subtasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Employees view equipment" ON equipment;
CREATE POLICY "Employees view equipment"
  ON equipment FOR SELECT USING (true);

DROP POLICY IF EXISTS "Employees view talents" ON talents;
CREATE POLICY "Employees view talents"
  ON talents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Employees view bookings" ON talent_bookings;
CREATE POLICY "Employees view bookings"
  ON talent_bookings FOR SELECT USING (true);

-- 7. Remove category delete-protection triggers
DROP TRIGGER IF EXISTS trg_prevent_delete_used_expense_category ON expense_categories;
DROP TRIGGER IF EXISTS trg_prevent_delete_used_equipment_category ON equipment_categories;
DROP FUNCTION IF EXISTS prevent_delete_used_category();
