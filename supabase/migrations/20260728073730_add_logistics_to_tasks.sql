-- Add logistics column to tasks table
-- This column will store videography logistics data for Phase 2 tasks

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS logistics jsonb;
  END IF;
END $$;

-- Update RLS policies to include the new column
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Tasks viewable by everyone') THEN
    DROP POLICY IF EXISTS "Tasks viewable by everyone" ON tasks;
  END IF;

  CREATE POLICY "Tasks viewable by everyone" ON tasks FOR SELECT USING (true);
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin/founder can insert tasks') THEN
    DROP POLICY IF EXISTS "Admin/founder can insert tasks" ON tasks;
  END IF;

  CREATE POLICY "Admin/founder can insert tasks"
    ON tasks FOR INSERT
    WITH CHECK (is_admin_or_founder(auth.uid()));
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all tasks') THEN
    DROP POLICY IF EXISTS "Admins can update all tasks" ON tasks;
  END IF;

  CREATE POLICY "Admins can update all tasks"
    ON tasks FOR UPDATE
    USING (is_admin_or_founder(auth.uid()));
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Employees can update their assigned tasks') THEN
    DROP POLICY IF EXISTS "Employees can update their assigned tasks" ON tasks;
  END IF;

  CREATE POLICY "Employees can update their assigned tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = assigned_to);
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin/founder can delete tasks') THEN
    DROP POLICY IF EXISTS "Admin/founder can delete tasks" ON tasks;
  END IF;

  CREATE POLICY "Admin/founder can delete tasks"
    ON tasks FOR DELETE
    USING (is_admin_or_founder(auth.uid()));
END $$;