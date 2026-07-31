-- Critical security hardening
-- Run manually after deploying the associated application changes.
-- This is a forward-only migration; historical migrations remain unchanged.

BEGIN;

-- Prevent self-service profile updates from granting privileged access.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_founder(auth.uid())
     AND (
       NEW.role IS DISTINCT FROM OLD.role
       OR NEW.designation IS DISTINCT FROM OLD.designation
     ) THEN
    RAISE EXCEPTION 'Only an admin or founder can change role or designation'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Clients and projects must never be readable with the anonymous key.
DROP POLICY IF EXISTS "Clients viewable by everyone" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Projects viewable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
CREATE POLICY "Authenticated users can view projects"
  ON public.projects FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');

-- Invoice line items and project budgets contain financial details.
DROP POLICY IF EXISTS "Employees can view invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Admins full access on invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Admin/founder all on invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Admins and founders manage invoice items" ON public.invoice_items;
CREATE POLICY "Admins and founders manage invoice items"
  ON public.invoice_items FOR ALL TO authenticated
  USING (public.is_admin_or_founder(auth.uid()))
  WITH CHECK (public.is_admin_or_founder(auth.uid()));

DROP POLICY IF EXISTS "Employees view project_budgets" ON public.project_budgets;
DROP POLICY IF EXISTS "Admins manage project_budgets" ON public.project_budgets;
DROP POLICY IF EXISTS "Admins and founders manage project budgets" ON public.project_budgets;
CREATE POLICY "Admins and founders manage project budgets"
  ON public.project_budgets FOR ALL TO authenticated
  USING (public.is_admin_or_founder(auth.uid()))
  WITH CHECK (public.is_admin_or_founder(auth.uid()));

-- Notification inserts may target only the caller unless the caller is privileged.
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users and admins can insert notifications" ON public.notifications;
CREATE POLICY "Users and admins can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_founder(auth.uid()));

-- Archived privileged profiles must not retain package write access.
DROP POLICY IF EXISTS "Admins and founders full access on packages" ON public.packages;
DROP POLICY IF EXISTS "Active admins and founders manage packages" ON public.packages;
CREATE POLICY "Active admins and founders manage packages" ON public.packages FOR ALL TO authenticated
  USING (public.is_admin_or_founder(auth.uid()))
  WITH CHECK (public.is_admin_or_founder(auth.uid()));

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'package_items', 'package_logistics', 'package_site_visits',
    'package_post_prod', 'package_deliverables', 'package_payments', 'package_audit_logs'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      'Admins and founders manage ' || table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      'Active admins and founders manage ' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin_or_founder(auth.uid())) WITH CHECK (public.is_admin_or_founder(auth.uid()))',
      'Active admins and founders manage ' || table_name, table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Client meetings viewable by all" ON public.client_meetings;
DROP POLICY IF EXISTS "Authenticated users view client meetings" ON public.client_meetings;
CREATE POLICY "Authenticated users view client meetings"
  ON public.client_meetings FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "History viewable by all" ON public.talent_project_history;
DROP POLICY IF EXISTS "Authenticated users view talent project history" ON public.talent_project_history;
CREATE POLICY "Authenticated users view talent project history"
  ON public.talent_project_history FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users view app config" ON public.app_config;
DROP POLICY IF EXISTS "Admins manage app config" ON public.app_config;
CREATE POLICY "Authenticated users view app config" ON public.app_config FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');
CREATE POLICY "Admins manage app config" ON public.app_config FOR ALL TO authenticated
  USING (public.is_admin_or_founder(auth.uid()))
  WITH CHECK (public.is_admin_or_founder(auth.uid()));

ALTER TABLE public.attendance_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users view attendance config" ON public.attendance_config;
DROP POLICY IF EXISTS "Admins manage attendance config" ON public.attendance_config;
CREATE POLICY "Authenticated users view attendance config" ON public.attendance_config FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');
CREATE POLICY "Admins manage attendance config" ON public.attendance_config FOR ALL TO authenticated
  USING (public.is_admin_or_founder(auth.uid()))
  WITH CHECK (public.is_admin_or_founder(auth.uid()));

COMMIT;
