-- Rollback Migration 018: Security Hardening (RLS & Storage Buckets)

SET search_path = public;

DO $$ BEGIN
  -- Restore original PROFILES policy
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP POLICY IF EXISTS "Admin/founder can update profiles" ON profiles;
    CREATE POLICY "Admins can update all profiles" 
      ON profiles FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
  END IF;

  -- Restore original ATTENDANCE policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
    DROP POLICY IF EXISTS "Attendance viewable by admin/founder" ON attendance;
    CREATE POLICY "Attendance viewable by admins" 
      ON attendance FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

    DROP POLICY IF EXISTS "Attendance updatable by admin/founder" ON attendance;
    CREATE POLICY "Admins can update attendance" 
      ON attendance FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
  END IF;
END $$;

-- Drop storage policies
DROP POLICY IF EXISTS "Authenticated users can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view equipment photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload equipment photos" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view talent photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload talent photos" ON storage.objects;
