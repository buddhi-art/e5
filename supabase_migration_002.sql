-- Create Sub-tasks table
create table subtasks (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for subtasks
alter table subtasks enable row level security;

-- Admins can do anything
create policy "Admins can manage subtasks" on subtasks for all using (auth.uid() in (select id from profiles where role = 'admin'));

-- Employees can select all subtasks
create policy "Employees can view subtasks" on subtasks for select using (true);

-- Employees can update their own subtasks (via task assignment)
create policy "Employees can update assigned subtasks" on subtasks for update using (
  auth.uid() = (select assigned_to from tasks where id = subtasks.task_id)
);
