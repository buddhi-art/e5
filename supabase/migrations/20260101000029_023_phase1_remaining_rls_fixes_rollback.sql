-- Rollback Migration 023: Phase 1 Remaining RLS fixes
SET search_path = public;

-- 1. Restore clients policies
DROP POLICY IF EXISTS "Admin/founder can insert clients" ON clients;
DROP POLICY IF EXISTS "Admin/founder can update clients" ON clients;
DROP POLICY IF EXISTS "Admin/founder can delete clients" ON clients;
CREATE POLICY "Admins can insert clients" ON clients FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins can update clients" ON clients FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins can delete clients" ON clients FOR DELETE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 2. Restore tasks policies
DROP POLICY IF EXISTS "Admin/founder can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Admin/founder can delete tasks" ON tasks;
CREATE POLICY "Admins can insert tasks" ON tasks FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins can delete tasks" ON tasks FOR DELETE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 3. Restore comments policies
DROP POLICY IF EXISTS "Admin/founder can insert comments" ON comments;
CREATE POLICY "Admins can insert comments" ON comments FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 4. Restore invoice_items policies
DROP POLICY IF EXISTS "Admin/founder all on invoice_items" ON invoice_items;
CREATE POLICY "Admins full access on invoice_items" ON invoice_items FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 5. Restore client_meetings policies
DROP POLICY IF EXISTS "Admin/founder can insert meetings" ON client_meetings;
DROP POLICY IF EXISTS "Admin/founder can update meetings" ON client_meetings;
DROP POLICY IF EXISTS "Admin/founder can delete meetings" ON client_meetings;
CREATE POLICY "Admins can insert meetings" ON client_meetings FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins can update meetings" ON client_meetings FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 6. Restore talent_types policies
DROP POLICY IF EXISTS "Admin/founder can insert talent types" ON talent_types;
DROP POLICY IF EXISTS "Admin/founder can update talent types" ON talent_types;
DROP POLICY IF EXISTS "Admin/founder can delete talent types" ON talent_types;
CREATE POLICY "Admins can insert talent types" ON talent_types FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 7. Restore equipment_checkouts employee view policy
DROP POLICY IF EXISTS "Employees view their checkouts" ON equipment_checkouts;
CREATE POLICY "Employees view their checkouts" ON equipment_checkouts FOR SELECT
  USING (auth.uid() = checked_out_by OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 8. Restore equipment_maintenance employee view policy
DROP POLICY IF EXISTS "Employees view maintenance" ON equipment_maintenance;
CREATE POLICY "Employees view maintenance" ON equipment_maintenance FOR SELECT USING (true);

-- 9. Drop admin/founder view deleted profiles policy
DROP POLICY IF EXISTS "Admin/founder can view deleted profiles" ON profiles;

-- 10. Drop admin/founder view deleted categories policies
DROP POLICY IF EXISTS "Admin/founder can view deleted expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Admin/founder can view deleted equipment categories" ON equipment_categories;

-- 11. Drop talent photo validation trigger
DROP TRIGGER IF EXISTS trg_storage_validate_talent_photo ON storage.objects;
DROP FUNCTION IF EXISTS storage_validate_talent_photo();

-- 12. Drop invoice status validation trigger
DROP TRIGGER IF EXISTS trg_validate_invoice_status ON invoices;
DROP FUNCTION IF EXISTS validate_invoice_status_transition();

-- 13. Drop attendance unique constraint (if added by this migration)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'attendance'
      AND constraint_name = 'attendance_user_date_unique'
  ) THEN
    ALTER TABLE attendance DROP CONSTRAINT attendance_user_date_unique;
  END IF;
END $$;
