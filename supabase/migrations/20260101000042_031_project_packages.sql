-- Migration 031: Editable project packages
-- Packages become dynamic rows (managed via +Add / delete in the project forms)
-- instead of a fixed enum, so admins/founders can maintain the list at runtime.

-- 1. New table holding the selectable package options.
create table if not exists project_packages (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Packages are now dynamic, so the fixed check constraint no longer applies.
--    projects.package stays a nullable text column; existing values are preserved.
alter table projects
  drop constraint if exists projects_package_check;

-- 3. RLS: admins/founders manage the list; any authenticated user can read it
--    (the project forms need to list options). Mirrors verifyAdminOrFounder().
alter table project_packages enable row level security;

create policy "Admins and founders manage project packages" on project_packages for all
  using (auth.uid() in (
    select id from profiles where role = 'admin' or designation = 'Founder'
  ));

create policy "Authenticated users view project packages" on project_packages
  for select using (true);
