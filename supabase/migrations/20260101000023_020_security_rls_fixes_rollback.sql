-- Rollback Migration 020: Security RLS Fixes
SET search_path = public;

-- 1. Restore company natures policy
DROP POLICY IF EXISTS "Company natures viewable by all" ON company_natures;
DROP POLICY IF EXISTS "Admins can insert company natures" ON company_natures;
DROP POLICY IF EXISTS "Admins can update company natures" ON company_natures;
DROP POLICY IF EXISTS "Admins can delete company natures" ON company_natures;
CREATE POLICY "Allow authenticated full access on company_natures" ON company_natures FOR ALL TO authenticated USING (true);

-- 2. Restore referral_sources policy
DROP POLICY IF EXISTS "Referral sources viewable by all" ON referral_sources;
DROP POLICY IF EXISTS "Admins can insert referral sources" ON referral_sources;
DROP POLICY IF EXISTS "Admins can update referral sources" ON referral_sources;
DROP POLICY IF EXISTS "Admins can delete referral sources" ON referral_sources;
CREATE POLICY "Allow authenticated full access on referral_sources" ON referral_sources FOR ALL TO authenticated USING (true);

-- 3. Restore designations policy
DROP POLICY IF EXISTS "Designations viewable by all" ON designations;
DROP POLICY IF EXISTS "Admins can insert designations" ON designations;
DROP POLICY IF EXISTS "Admins can update designations" ON designations;
DROP POLICY IF EXISTS "Admins can delete designations" ON designations;
CREATE POLICY "Allow authenticated full access on designations" ON designations FOR ALL TO authenticated USING (true);

-- 4. Restore sub_subtasks update policy
DROP POLICY IF EXISTS "Employees can update own sub_subtasks" ON sub_subtasks;
CREATE POLICY "Employees can update sub_subtasks" ON sub_subtasks FOR UPDATE USING (true);

-- 5. Remove employee self-update policy on profiles
DROP POLICY IF EXISTS "Employees can update own profile" ON profiles;

-- 6. Restore client_meetings admin-only policy
DROP POLICY IF EXISTS "Client meetings viewable by all" ON client_meetings;
CREATE POLICY "Client meetings viewable by admins" ON client_meetings FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 7. Restore invoices admin-only and employee view policies
DROP POLICY IF EXISTS "Admins all on invoices" ON invoices;
DROP POLICY IF EXISTS "Employees can view invoices" ON invoices;
CREATE POLICY "Admins full access on invoices" ON invoices FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Employees can view invoices" ON invoices FOR SELECT USING (true);

-- 8. Restore payments policy
DROP POLICY IF EXISTS "Admins manage payments" ON payments;
CREATE POLICY "Admins manage payments" ON payments FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 9. Restore expenses policy
DROP POLICY IF EXISTS "Admins all on expenses" ON expenses;
CREATE POLICY "Admins full access on expenses" ON expenses FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 10. Restore project_budgets policy
DROP POLICY IF EXISTS "Admins manage project_budgets" ON project_budgets;
CREATE POLICY "Admins manage project_budgets" ON project_budgets FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 11. Restore equipment policies
DROP POLICY IF EXISTS "Admins manage equipment" ON equipment;
CREATE POLICY "Admins manage equipment" ON equipment FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins manage checkouts" ON equipment_checkouts;
CREATE POLICY "Admins manage checkouts" ON equipment_checkouts FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins manage maintenance" ON equipment_maintenance;
CREATE POLICY "Admins manage maintenance" ON equipment_maintenance FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 12. Restore talent policies
DROP POLICY IF EXISTS "Admins manage talents" ON talents;
CREATE POLICY "Admins manage talents" ON talents FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins manage bookings" ON talent_bookings;
CREATE POLICY "Admins manage bookings" ON talent_bookings FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins manage history" ON talent_project_history;
CREATE POLICY "Admins manage history" ON talent_project_history FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 13. Restore leave policies
DROP POLICY IF EXISTS "Admins manage leave types" ON leave_types;
CREATE POLICY "Admins manage leave types" ON leave_types FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins manage balances" ON leave_balances;
CREATE POLICY "Admins manage balances" ON leave_balances FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins manage all leave requests" ON leave_requests;
CREATE POLICY "Admins manage all leave requests" ON leave_requests FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 14. Restore holidays policy
DROP POLICY IF EXISTS "Admins manage holidays" ON holidays;
CREATE POLICY "Admins manage holidays" ON holidays FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 15. Restore timesheet policies
DROP POLICY IF EXISTS "Admins manage all timesheets" ON timesheets;
CREATE POLICY "Admins manage all timesheets" ON timesheets FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins manage all entries" ON timesheet_entries;
CREATE POLICY "Admins manage all entries" ON timesheet_entries FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 16. Restore category policies
DROP POLICY IF EXISTS "Admins manage expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Admins update expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Admins delete expense categories" ON expense_categories;
CREATE POLICY "Admins can insert categories" ON expense_categories FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins manage equipment categories" ON equipment_categories;
DROP POLICY IF EXISTS "Admins update equipment categories" ON equipment_categories;
DROP POLICY IF EXISTS "Admins delete equipment categories" ON equipment_categories;
CREATE POLICY "Admins can insert categories" ON equipment_categories FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 17. Restore profile policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- 18. Restore subtask policies
DROP POLICY IF EXISTS "Admins can manage subtasks" ON subtasks;
CREATE POLICY "Admins can manage subtasks" ON subtasks FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 19. Restore subtask_comments policy
DROP POLICY IF EXISTS "Admins can insert subtask comments" ON subtask_comments;
CREATE POLICY "Admins can insert subtask comments" ON subtask_comments FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 20. Restore sub_subtasks policy
DROP POLICY IF EXISTS "Admins full access on sub_subtasks" ON sub_subtasks;
CREATE POLICY "Admins full access on sub_subtasks" ON sub_subtasks FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
