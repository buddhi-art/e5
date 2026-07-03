-- Migration 014: Add PAN/VAT to clients, check-in/out to attendance

-- 1. Add PAN and VAT ID to clients
alter table clients add column if not exists pan_number text;
alter table clients add column if not exists vat_id text;

-- 2. Add check-in and check-out time columns to attendance
alter table attendance add column if not exists check_in_time timestamptz;
alter table attendance add column if not exists check_out_time timestamptz;

-- 3. Allow employees to update their own attendance records (needed for check-out/check-in update)
drop policy if exists "Employees can update own attendance" on attendance;
create policy "Employees can update own attendance" on attendance
  for update using (auth.uid() = user_id);

-- 4. Allow employees to insert their own attendance (should exist already)
drop policy if exists "Employees can insert own attendance" on attendance;
create policy "Employees can insert own attendance" on attendance
  for insert with check (auth.uid() = user_id);
