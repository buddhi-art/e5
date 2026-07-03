-- Migration 026: Phase 4 — UX & Feature Completion
-- Adds: invoice_timeline, notifications, kanban support, equipment manual ID
-- Re-runnable: uses IF NOT EXISTS / CREATE OR REPLACE throughout
SET search_path = public;

-- =============================================================================
-- 1. Invoice Timeline
-- =============================================================================
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS invoice_timeline (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    event text NOT NULL CHECK (event IN ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled')),
    occurred_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
  );
  ALTER TABLE invoice_timeline ENABLE ROW LEVEL SECURITY;
END $$;

DROP POLICY IF EXISTS "Admins view invoice timeline" ON invoice_timeline;
CREATE POLICY "Admins view invoice timeline"
  ON invoice_timeline FOR SELECT
  USING (is_admin_or_founder(auth.uid()));

DROP POLICY IF EXISTS "Admins insert invoice timeline" ON invoice_timeline;
CREATE POLICY "Admins insert invoice timeline"
  ON invoice_timeline FOR INSERT
  WITH CHECK (is_admin_or_founder(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_invoice_timeline_invoice
  ON invoice_timeline(invoice_id, occurred_at);

-- Auto-insert timeline entries on invoice status changes
CREATE OR REPLACE FUNCTION log_invoice_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO invoice_timeline (invoice_id, event, occurred_at, metadata)
    VALUES (NEW.id, COALESCE(NEW.status, 'draft'), now(), jsonb_build_object('status', NEW.status));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO invoice_timeline (invoice_id, event, occurred_at, metadata)
    VALUES (NEW.id, NEW.status, now(), jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_timeline ON invoices;
CREATE TRIGGER trg_invoice_timeline
  AFTER INSERT OR UPDATE OF status ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION log_invoice_timeline();

-- =============================================================================
-- 2. Notifications Table
-- =============================================================================
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text,
    href text,
    email_sent boolean DEFAULT false,
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
  );
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
END $$;

-- Users can view their own notifications; admins can view all
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id OR is_admin_or_founder(auth.uid()));

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);  -- Only SQL functions insert, RLS is fine

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read_at)
  WHERE read_at IS NULL;

-- =============================================================================
-- 3. Add manual_asset_id to equipment for QR fallback
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipment') THEN
    ALTER TABLE equipment ADD COLUMN IF NOT EXISTS manual_asset_id text;
    ALTER TABLE equipment ADD COLUMN IF NOT EXISTS asset_id_type text DEFAULT 'qr' CHECK (asset_id_type IN ('qr', 'manual'));
  END IF;
END $$;

-- =============================================================================
-- 4. Helper function: create notification
-- =============================================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_description text DEFAULT NULL,
  p_href text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, description, href)
  VALUES (p_user_id, p_type, p_title, p_description, p_href)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- =============================================================================
-- 5. RLS on equipment for manual_asset_id read access
-- =============================================================================
-- (Existing RLS policies already cover SELECT — no change needed)

-- =============================================================================
-- 6. Indexes for kanban task querying
-- =============================================================================
-- Note: tasks table doesn't have deleted_at column, so index without filter
CREATE INDEX IF NOT EXISTS idx_tasks_status_assigned
  ON tasks(status, assigned_to);

CREATE INDEX IF NOT EXISTS idx_subtasks_task
  ON subtasks(task_id);
