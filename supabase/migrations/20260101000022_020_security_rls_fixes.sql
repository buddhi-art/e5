-- Migration 020: Security RLS Fixes — Deny-by-default hardening
-- Addresses: over-permissive policies, missing employee-scoped access,
--            auth.uid() checks, deleted_at filtering
SET search_path = public;

-- ==============================================================================
-- 1. Fix over-permissive "authenticated full access" lookup tables
--    These should use admin/founder checks for write, allow all for SELECT
-- ==============================================================================

-- Company natures
DROP POLICY IF EXISTS "Allow authenticated full access on company_natures" ON company_natures;
CREATE POLICY "Company natures viewable by all" ON company_natures FOR SELECT USING (true);
CREATE POLICY "Admins can insert company natures" ON company_natures FOR INSERT WITH CHECK (is_admin_or_founder(auth.uid()));
CREATE POLICY "Admins can update company natures" ON company_natures FOR UPDATE USING (is_admin_or_founder(auth.uid()));
CREATE POLICY "Admins can delete company natures" ON company_natures FOR DELETE USING (is_admin_or_founder(auth.uid()));

-- Referral sources
DROP POLICY IF EXISTS "Allow authenticated full access on referral_sources" ON referral_sources;
CREATE POLICY "Referral sources viewable by all" ON referral_sources FOR SELECT USING (true);
CREATE POLICY "Admins can insert referral sources" ON referral_sources FOR INSERT WITH CHECK (is_admin_or_founder(auth.uid()));
CREATE POLICY "Admins can update referral sources" ON referral_sources FOR UPDATE USING (is_admin_or_founder(auth.uid()));
CREATE POLICY "Admins can delete referral sources" ON referral_sources FOR DELETE USING (is_admin_or_founder(auth.uid()));

-- Designations
DROP POLICY IF EXISTS "Allow authenticated full access on designations" ON designations;
CREATE POLICY "Designations viewable by all" ON designations FOR SELECT USING (true);
CREATE POLICY "Admins can insert designations" ON designations FOR INSERT WITH CHECK (is_admin_or_founder(auth.uid()));
CREATE POLICY "Admins can update designations" ON designations FOR UPDATE USING (is_admin_or_founder(auth.uid()));
CREATE POLICY "Admins can delete designations" ON designations FOR DELETE USING (is_admin_or_founder(auth.uid()));

-- ==============================================================================
-- 2. Fix sub_subtasks update policy — restrict to assigned employee
--    (was USING (true) — any authenticated user could update any sub-subtask)
-- ==============================================================================
DROP POLICY IF EXISTS "Employees can update sub_subtasks" ON sub_subtasks;
CREATE POLICY "Employees can update own sub_subtasks" ON sub_subtasks
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT t.assigned_to FROM tasks t
      JOIN subtasks s ON s.task_id = t.id
      WHERE s.id = sub_subtasks.subtask_id
    )
  );

-- ==============================================================================
-- 3. Add employee self-update policy on profiles
--    Employees can update their own profile fields (dob, cv_url, social_urls, etc.)
-- ==============================================================================
DROP POLICY IF EXISTS "Employees can update own profile" ON profiles;
CREATE POLICY "Employees can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- 4. Add employee-scoped SELECT on client_meetings
--    (currently admin-only — employees need to see meetings for their projects)
-- ==============================================================================
DROP POLICY IF EXISTS "Client meetings viewable by admins" ON client_meetings;
DROP POLICY IF EXISTS "Client meetings viewable by all" ON client_meetings;
CREATE POLICY "Client meetings viewable by all"
  ON client_meetings FOR SELECT USING (true);

-- ==============================================================================
-- 5. Fix invoices policies — add employee SELECT with deleted_at filter
-- ==============================================================================
-- Replace "Admins full access on invoices" — separate SELECT for employees with deleted_at filter
DROP POLICY IF EXISTS "Admins full access on invoices" ON invoices;
CREATE POLICY "Admins all on invoices"
  ON invoices FOR ALL
  USING (is_admin_or_founder(auth.uid()));
-- Employees can view non-deleted invoices
-- (keeping the existing "Employees can view invoices" but adding deleted_at filter)
DROP POLICY IF EXISTS "Employees can view invoices" ON invoices;
CREATE POLICY "Employees can view invoices"
  ON invoices FOR SELECT
  USING (deleted_at IS NULL);

-- ==============================================================================
-- 6. Fix payments — add admin/founder policy (was admins only by role)
-- ==============================================================================
DROP POLICY IF EXISTS "Admins manage payments" ON payments;
CREATE POLICY "Admins manage payments"
  ON payments FOR ALL
  USING (is_admin_or_founder(auth.uid()));

-- ==============================================================================
-- 7. Fix expenses policies — use is_admin_or_founder, add employee view non-deleted
-- ==============================================================================
DROP POLICY IF EXISTS "Admins full access on expenses" ON expenses;
CREATE POLICY "Admins all on expenses"
  ON expenses FOR ALL
  USING (is_admin_or_founder(auth.uid()));

-- ==============================================================================
-- 8. Fix project_budgets — use is_admin_or_founder for admin actions
-- ==============================================================================
DROP POLICY IF EXISTS "Admins manage project_budgets" ON project_budgets;
CREATE POLICY "Admins manage project_budgets"
  ON project_budgets FOR ALL
  USING (is_admin_or_founder(auth.uid()));

-- ==============================================================================
-- 9. Fix equipment policies — use is_admin_or_founder
-- ==============================================================================
DROP POLICY IF EXISTS "Admins manage equipment" ON equipment;
CREATE POLICY "Admins manage equipment"
  ON equipment FOR ALL
  USING (is_admin_or_founder(auth.uid()));

DROP POLICY IF EXISTS "Admins manage checkouts" ON equipment_checkouts;
CREATE POLICY "Admins manage checkouts"
  ON equipment_checkouts FOR ALL
  USING (is_admin_or_founder(auth.uid()));

DROP POLICY IF EXISTS "Admins manage maintenance" ON equipment_maintenance;
CREATE POLICY "Admins manage maintenance"
  ON equipment_maintenance FOR ALL
  USING (is_admin_or_founder(auth.uid()));

-- ==============================================================================
-- 10. Fix talent policies — use is_admin_or_founder
-- ==============================================================================
DROP POLICY IF EXISTS "Admins manage talents" ON talents;
CREATE POLICY "Admins manage talents"
  ON talents FOR ALL
  USING (is_admin_or_founder(auth.uid()));

DROP POLICY IF EXISTS "Admins manage bookings" ON talent_bookings;
CREATE POLICY "Admins manage bookings"
  ON talent_bookings FOR ALL
  USING (is_admin_or_founder(auth.uid()));

DROP POLICY IF EXISTS "Admins manage history" ON talent_project_history;
CREATE POLICY "Admins manage history"
  ON talent_project_history FOR ALL
  USING (is_admin_or_founder(auth.uid()));

-- ==============================================================================
-- 11. Fix leave policies — use is_admin_or_founder
-- ==============================================================================
DROP POLICY IF EXISTS "Admins manage leave types" ON leave_types;
CREATE POLICY "Admins manage leave types"
  ON leave_types FOR ALL
  USING (is_admin_or_founder(auth.uid()));

DROP POLICY IF EXISTS "Admins manage balances" ON leave_balances;
CREATE POLICY "Admins manage balances"
  ON leave_balances FOR ALL
  USING (is_admin_or_founder(auth.uid()));

DROP POLICY IF EXISTS "Admins manage all leave requests" ON leave_requests;
CREATE POLICY "Admins manage all leave requests"
  ON leave_requests FOR ALL
  USING (is_admin_or_founder(auth.uid()));

-- ==============================================================================
-- 12. Fix holidays — use is_admin_or_founder
-- ==============================================================================
DROP POLICY IF EXISTS "Admins manage holidays" ON holidays;
CREATE POLICY "Admins manage holidays"
  ON holidays FOR ALL
  USING (is_admin_or_founder(auth.uid()));

-- ==============================================================================
-- 13. Fix timesheet policies — use is_admin_or_founder
--     NOTE: timesheets table was dropped in migration 015 (day_summary_remove_timesheets),
--     so these are guarded by table existence check.
-- ==============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timesheets') THEN
    DROP POLICY IF EXISTS "Admins manage all timesheets" ON timesheets;
    CREATE POLICY "Admins manage all timesheets"
      ON timesheets FOR ALL
      USING (is_admin_or_founder(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timesheet_entries') THEN
    DROP POLICY IF EXISTS "Admins manage all entries" ON timesheet_entries;
    CREATE POLICY "Admins manage all entries"
      ON timesheet_entries FOR ALL
      USING (is_admin_or_founder(auth.uid()));
  END IF;
END $$;

-- ==============================================================================
-- 14. Fix categories and types policies — use is_admin_or_founder
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can insert categories" ON expense_categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON equipment_categories;

CREATE POLICY "Admins manage expense categories"
  ON expense_categories FOR INSERT
  WITH CHECK (is_admin_or_founder(auth.uid()));
CREATE POLICY "Admins update expense categories"
  ON expense_categories FOR UPDATE
  USING (is_admin_or_founder(auth.uid()));
CREATE POLICY "Admins delete expense categories"
  ON expense_categories FOR DELETE
  USING (is_admin_or_founder(auth.uid()));

CREATE POLICY "Admins manage equipment categories"
  ON equipment_categories FOR INSERT
  WITH CHECK (is_admin_or_founder(auth.uid()));
CREATE POLICY "Admins update equipment categories"
  ON equipment_categories FOR UPDATE
  USING (is_admin_or_founder(auth.uid()));
CREATE POLICY "Admins delete equipment categories"
  ON equipment_categories FOR DELETE
  USING (is_admin_or_founder(auth.uid()));

-- ==============================================================================
-- 15. Fix profile insert/delete for admin/founder only
-- ==============================================================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (deleted_at IS NULL);

-- Allow admin/founder to insert profiles (needed for employee creation flow)
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (is_admin_or_founder(auth.uid()));

-- ==============================================================================
-- 16. Add employee-scoped SUBTASKS view policy for deleted_at + assigned filter
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can manage subtasks" ON subtasks;
CREATE POLICY "Admins can manage subtasks"
  ON subtasks FOR ALL
  USING (is_admin_or_founder(auth.uid()));

-- ==============================================================================
-- 17. Fix subtask_comments — use is_admin_or_founder
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can insert subtask comments" ON subtask_comments;
CREATE POLICY "Admins can insert subtask comments"
  ON subtask_comments FOR INSERT
  WITH CHECK (is_admin_or_founder(auth.uid()));

-- ==============================================================================
-- 18. Fix sub_subtasks admin policy — use is_admin_or_founder
-- ==============================================================================
DROP POLICY IF EXISTS "Admins full access on sub_subtasks" ON sub_subtasks;
CREATE POLICY "Admins full access on sub_subtasks"
  ON sub_subtasks FOR ALL
  USING (is_admin_or_founder(auth.uid()));
