-- Rollback Migration 027: Phase 5 — Testing & CI Support
DROP FUNCTION IF EXISTS test_generate_batch_invoice_numbers(text, integer);
DROP FUNCTION IF EXISTS test_seed_equipment(text, text);
DROP FUNCTION IF EXISTS test_cleanup_equipment(uuid);
DROP FUNCTION IF EXISTS test_create_employee_profile(text, text, text);
DROP INDEX IF EXISTS idx_profiles_email_role;
