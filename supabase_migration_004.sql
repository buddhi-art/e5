-- Create subtask_comments table for per-subtask discussion
create table subtask_comments (
  id uuid default uuid_generate_v4() primary key,
  subtask_id uuid references subtasks(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table subtask_comments enable row level security;

-- Policies: admins and employees on the task can read/write
create policy "Subtask comments viewable by everyone" on subtask_comments for select using (true);

create policy "Admins can insert subtask comments" on subtask_comments for insert with check (
  auth.uid() in (select id from profiles where role = 'admin')
);

create policy "Employees can insert on their assigned subtasks" on subtask_comments for insert with check (
  auth.uid() = (select assigned_to from tasks where id = (select task_id from subtasks where id = subtask_id))
);

-- Index for faster lookups
create index idx_subtask_comments_subtask_id on subtask_comments(subtask_id);
create index idx_subtask_comments_created_at on subtask_comments(created_at);
