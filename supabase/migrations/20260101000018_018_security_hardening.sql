-- Migration 018: Security Hardening (RLS & Storage Buckets)
-- Re-runnable: uses IF NOT EXISTS / DROP IF EXISTS / ON CONFLICT DO NOTHING
SET search_path = public;

-- ==============================================================================
-- 1. Ensure all standard tables have RLS enabled (idempotent)
-- ==============================================================================
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Migrate remaining role-based policies to use is_admin_or_founder()
--    (profiles + attendance — projects were already done in migration 017)
-- ==============================================================================
DO $$ BEGIN
  -- PROFILES
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
    DROP POLICY IF EXISTS "Admin/founder can update profiles" ON profiles;
    CREATE POLICY "Admin/founder can update profiles"
      ON profiles FOR UPDATE
      USING (is_admin_or_founder(auth.uid()));
  END IF;

  -- ATTENDANCE
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
    DROP POLICY IF EXISTS "Attendance viewable by admins" ON attendance;
    DROP POLICY IF EXISTS "Attendance viewable by admin/founder" ON attendance;
    CREATE POLICY "Attendance viewable by admin/founder"
      ON attendance FOR SELECT
      USING (is_admin_or_founder(auth.uid()));

    DROP POLICY IF EXISTS "Admins can update attendance" ON attendance;
    DROP POLICY IF EXISTS "Attendance updatable by admin/founder" ON attendance;
    CREATE POLICY "Attendance updatable by admin/founder"
      ON attendance FOR UPDATE
      USING (is_admin_or_founder(auth.uid()));
  END IF;
END $$;

-- ==============================================================================
-- 3. Storage Buckets & Policies
-- ==============================================================================

-- Ensure standard buckets exist
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('receipts', 'receipts', false),
  ('equipment-photos', 'equipment-photos', true),
  ('talent-photos', 'talent-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects (idempotent)
-- ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Receipts Bucket (Private — authenticated users only)
DROP POLICY IF EXISTS "Authenticated users can view receipts" ON storage.objects;
CREATE POLICY "Authenticated users can view receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts');

-- Equipment Photos (Public — anyone can view, authenticated can upload)
DROP POLICY IF EXISTS "Anyone can view equipment photos" ON storage.objects;
CREATE POLICY "Anyone can view equipment photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'equipment-photos');

DROP POLICY IF EXISTS "Authenticated users can upload equipment photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload equipment photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'equipment-photos');

-- Talent Photos (Public — anyone can view, authenticated can upload)
DROP POLICY IF EXISTS "Anyone can view talent photos" ON storage.objects;
CREATE POLICY "Anyone can view talent photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'talent-photos');

DROP POLICY IF EXISTS "Authenticated users can upload talent photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload talent photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'talent-photos');
