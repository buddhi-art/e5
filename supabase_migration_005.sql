-- Add deleted_at columns for soft-delete / archive functionality
alter table clients add column if not exists deleted_at timestamp with time zone;
alter table projects add column if not exists deleted_at timestamp with time zone;
alter table profiles add column if not exists deleted_at timestamp with time zone;

-- Add email column to profiles if missing (used by employee management)
alter table profiles add column if not exists email text;

-- Sub-sub-tasks table
create table if not exists sub_subtasks (
  id uuid default uuid_generate_v4() primary key,
  subtask_id uuid references subtasks(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for sub_subtasks
alter table sub_subtasks enable row level security;
create policy "Admins full access on sub_subtasks" on sub_subtasks for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Employees can view sub_subtasks" on sub_subtasks for select
  using (true);
create policy "Employees can update sub_subtasks" on sub_subtasks for update
  using (true); -- In a real app, restrict to assigned user
