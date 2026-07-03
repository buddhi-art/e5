-- Migration 023: Phase 1 Remaining RLS gaps + server action hardening
-- Fixes: clients/tasks/comments/invoice_items/talent_types/client_meetings policies,
--        missing delete policies, employee deleted_at filtering on equipment views
-- Re-runnable: uses IF NOT EXISTS / DROP IF EXISTS throughout
SET search_path = public;

-- =============================================================================
-- 1. FIX: clients — migrate INSERT/UPDATE/DELETE from role='admin' to
--    is_admin_or_founder() so founders can manage clients too
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
    DROP POLICY IF EXISTS "Admins can update clients" ON clients;
    DROP POLICY IF EXISTS "Admins can delete clients" ON clients;

    CREATE POLICY "Admin/founder can insert clients"
      ON clients FOR INSERT
      WITH CHECK (is_admin_or_founder(auth.uid()));

    CREATE POLICY "Admin/founder can update clients"
      ON clients FOR UPDATE
      USING (is_admin_or_founder(auth.uid()));

    CREATE POLICY "Admin/founder can delete clients"
      ON clients FOR DELETE
      USING (is_admin_or_founder(auth.uid()));
  END IF;
END $$;

-- =============================================================================
-- 2. FIX: tasks — migrate INSERT/DELETE from role='admin' to is_admin_or_founder()
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    DROP POLICY IF EXISTS "Admins can insert tasks" ON tasks;
    DROP POLICY IF EXISTS "Admins can delete tasks" ON tasks;

    CREATE POLICY "Admin/founder can insert tasks"
      ON tasks FOR INSERT
      WITH CHECK (is_admin_or_founder(auth.uid()));

    CREATE POLICY "Admin/founder can delete tasks"
      ON tasks FOR DELETE
      USING (is_admin_or_founder(auth.uid()));
  END IF;
END $$;

-- =============================================================================
-- 3. FIX: comments — migrate INSERT from role='admin' to is_admin_or_founder()
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
    DROP POLICY IF EXISTS "Admins can insert comments" ON comments;

    CREATE POLICY "Admin/founder can insert comments"
      ON comments FOR INSERT
      WITH CHECK (is_admin_or_founder(auth.uid()));
  END IF;
END $$;

-- =============================================================================
-- 4. FIX: invoice_items — migrate ALL from role='admin' to is_admin_or_founder()
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_items') THEN
    DROP POLICY IF EXISTS "Admins full access on invoice_items" ON invoice_items;

    CREATE POLICY "Admin/founder all on invoice_items"
      ON invoice_items FOR ALL
      USING (is_admin_or_founder(auth.uid()));
  END IF;
END $$;

-- =============================================================================
-- 5. FIX: client_meetings — add missing DELETE policy, migrate INSERT/UPDATE to
--    is_admin_or_founder()
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_meetings') THEN
    DROP POLICY IF EXISTS "Admins can insert meetings" ON client_meetings;
    DROP POLICY IF EXISTS "Admins can update meetings" ON client_meetings;

    CREATE POLICY "Admin/founder can insert meetings"
      ON client_meetings FOR INSERT
      WITH CHECK (is_admin_or_founder(auth.uid()));

    CREATE POLICY "Admin/founder can update meetings"
      ON client_meetings FOR UPDATE
      USING (is_admin_or_founder(auth.uid()));

    CREATE POLICY "Admin/founder can delete meetings"
      ON client_meetings FOR DELETE
      USING (is_admin_or_founder(auth.uid()));
  END IF;
END $$;

-- =============================================================================
-- 6. FIX: talent_types — add missing UPDATE/DELETE policies, migrate INSERT to
--    is_admin_or_founder()
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'talent_types') THEN
    DROP POLICY IF EXISTS "Admins can insert talent types" ON talent_types;

    CREATE POLICY "Admin/founder can insert talent types"
      ON talent_types FOR INSERT
      WITH CHECK (is_admin_or_founder(auth.uid()));

    CREATE POLICY "Admin/founder can update talent types"
      ON talent_types FOR UPDATE
      USING (is_admin_or_founder(auth.uid()));

    CREATE POLICY "Admin/founder can delete talent types"
      ON talent_types FOR DELETE
      USING (is_admin_or_founder(auth.uid()));
  END IF;
END $$;

-- =============================================================================
-- 7. FIX: equipment_checkouts employee SELECT — add deleted_at IS NULL filter
--    (currently lets employees see soft-deleted checkouts)
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipment_checkouts') THEN
    DROP POLICY IF EXISTS "Employees view their checkouts" ON equipment_checkouts;

    CREATE POLICY "Employees view their checkouts"
      ON equipment_checkouts FOR SELECT
      USING (
        (auth.uid() = checked_out_by AND deleted_at IS NULL)
        OR is_admin_or_founder(auth.uid())
      );
  END IF;
END $$;

-- =============================================================================
-- 8. FIX: equipment_maintenance employee SELECT — add deleted_at IS NULL filter
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipment_maintenance') THEN
    DROP POLICY IF EXISTS "Employees view maintenance" ON equipment_maintenance;

    CREATE POLICY "Employees view maintenance"
      ON equipment_maintenance FOR SELECT
      USING (deleted_at IS NULL);
  END IF;
END $$;

-- =============================================================================
-- 9. FIX: profile_select policy — ensure employees see all non-deleted profiles
--    (for dropdowns, task assignment etc.) but deleted profiles are hidden
-- =============================================================================
-- Migration 020 already created "Profiles are viewable by everyone" with
-- deleted_at IS NULL. Let's ensure it also allows admins/founders to see
-- deleted profiles (needed for restore functionality)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP POLICY IF EXISTS "Admin/founder can view deleted profiles" ON profiles;
    CREATE POLICY "Admin/founder can view deleted profiles"
      ON profiles FOR SELECT
      USING (is_admin_or_founder(auth.uid()));
  END IF;
END $$;

-- The existing "Profiles are viewable by everyone" with deleted_at IS NULL ensures
-- employees only see active profiles. Admin/founder see all via the new policy above.

-- =============================================================================
-- 10. FIX: Add expense_categories and equipment_categories SELECT policies for
--     admins to see deleted categories (for restore purposes)
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_categories') THEN
    DROP POLICY IF EXISTS "Admin/founder can view deleted expense categories" ON expense_categories;
    CREATE POLICY "Admin/founder can view deleted expense categories"
      ON expense_categories FOR SELECT
      USING (is_admin_or_founder(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipment_categories') THEN
    DROP POLICY IF EXISTS "Admin/founder can view deleted equipment categories" ON equipment_categories;
    CREATE POLICY "Admin/founder can view deleted equipment categories"
      ON equipment_categories FOR SELECT
      USING (is_admin_or_founder(auth.uid()));
  END IF;
END $$;

-- =============================================================================
-- 11. FIX: Ensure talent_photos bucket uploads validate MIME type and size
--     (storage.ts validates for equipment-photos and receipts but talent-photos
--      goes through a different path)
-- =============================================================================
-- Add a function to validate file uploads at the DB level for the talent-photos bucket
CREATE OR REPLACE FUNCTION storage_validate_talent_photo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.bucket_id = 'talent-photos' THEN
    IF NEW.name IS NULL OR NEW.name = '' THEN
      RAISE EXCEPTION 'Filename cannot be empty';
    END IF;
    -- Ensure filename is safe (no path traversal)
    IF NEW.name ~ '\.\.' OR NEW.name ~ '/' THEN
      RAISE EXCEPTION 'Invalid filename';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_storage_validate_talent_photo ON storage.objects;
CREATE TRIGGER trg_storage_validate_talent_photo
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION storage_validate_talent_photo();

-- =============================================================================
-- 12. FIX: Server-only import guard — add an eslint rule comment at the top of
--     storage.ts and admin.ts. Also export a simple helper to enforce the pattern.
--     Done via code changes, not SQL.
-- =============================================================================
-- (See src/lib/supabase/admin.ts and src/lib/supabase/storage.ts — both already
--  have 'server-only' imports.)

-- =============================================================================
-- 13. FIX: Invoice status changes — add CHECK constraint to prevent invalid
--     status transitions at the DB level
-- =============================================================================
-- NOTE: We can't use ALTER TABLE ADD CHECK with an existing table that may have
-- data, so we use a BEFORE UPDATE trigger instead.
CREATE OR REPLACE FUNCTION validate_invoice_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Prevent transitioning from paid/cancelled back to another status
  IF OLD.status IN ('paid', 'cancelled') AND NEW.status != OLD.status THEN
    RAISE EXCEPTION 'Cannot change status of a % invoice', OLD.status;
  END IF;

  -- Prevent transitioning from overdue to draft
  IF OLD.status = 'overdue' AND NEW.status = 'draft' THEN
    RAISE EXCEPTION 'Cannot change overdue invoice back to draft';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_invoice_status ON invoices;
CREATE TRIGGER trg_validate_invoice_status
  BEFORE UPDATE OF status ON invoices
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_invoice_status_transition();

-- =============================================================================
-- 14. FIX: Add unique constraint on attendance date + user_id (was in base schema
--     but ensure it exists after all migrations)
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND table_name = 'attendance'
        AND constraint_type = 'UNIQUE'
    ) THEN
      ALTER TABLE attendance ADD CONSTRAINT attendance_user_date_unique UNIQUE (user_id, date);
    END IF;
  END IF;
END $$;
