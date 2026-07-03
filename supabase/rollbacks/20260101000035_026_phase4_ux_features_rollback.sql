-- Rollback Migration 026
SET search_path = public;

DROP INDEX IF EXISTS idx_subtasks_task;
DROP INDEX IF EXISTS idx_tasks_status_assigned;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_invoice_timeline_invoice;

DROP TRIGGER IF EXISTS trg_invoice_timeline ON invoices;
DROP FUNCTION IF EXISTS log_invoice_timeline();
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, text, text);

ALTER TABLE equipment DROP COLUMN IF EXISTS asset_id_type;
ALTER TABLE equipment DROP COLUMN IF EXISTS manual_asset_id;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS invoice_timeline;
