-- E5 Chronicles - Feature 3: Timesheets
-- Run this in your Supabase SQL editor

-- ============================================================
-- PART 1: New Types
-- ============================================================
create type timesheet_status as enum ('draft', 'submitted', 'approved', 'rejected');
create type billable_type as enum ('billable', 'non_billable');

-- ============================================================
-- PART 2: New Tables
-- ============================================================

-- 2a. Timesheets
create table timesheets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  week_starting date not null,
  total_hours decimal(6,2) default 0,
  status timesheet_status default 'draft',
  notes text,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamp with time zone,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, week_starting)
);

-- 2b. Timesheet entries
create table timesheet_entries (
  id uuid default uuid_generate_v4() primary key,
  timesheet_id uuid references timesheets(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  date date not null,
  hours decimal(5,2) not null,
  description text,
  billable billable_type default 'billable',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- PART 4: Enable RLS
-- ============================================================
alter table timesheets enable row level security;
alter table timesheet_entries enable row level security;

-- ============================================================
-- PART 5: RLS Policies
-- ============================================================

-- Timesheets
create policy "Admins manage all timesheets" on timesheets for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees view own timesheets" on timesheets for select
  using (auth.uid() = user_id);
create policy "Employees create own timesheets" on timesheets for insert
  with check (auth.uid() = user_id);
create policy "Employees update own draft timesheets" on timesheets for update
  using (auth.uid() = user_id AND status IN ('draft', 'rejected'));

-- Timesheet entries
create policy "Admins manage all entries" on timesheet_entries for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees manage own entries" on timesheet_entries for all
  using (
    auth.uid() = (select user_id from timesheets where id = timesheet_entries.timesheet_id)
    AND (select status from timesheets where id = timesheet_entries.timesheet_id) IN ('draft', 'rejected')
  );

-- ============================================================
-- PART 6: Indexes
-- ============================================================
create index idx_timesheets_user_id on timesheets(user_id);
create index idx_timesheets_week on timesheets(week_starting);
create index idx_timesheet_entries_timesheet on timesheet_entries(timesheet_id);
create index idx_timesheet_entries_date on timesheet_entries(date);
