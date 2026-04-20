-- 1. Create a Storage Bucket for our files
insert into storage.buckets (id, name, public) 
values ('editor_files', 'editor_files', false)
on conflict do nothing;

-- 2. Create a Database Table to keep track of Files and Folders
create table public.files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  filename text not null,
  content text default '',
  language text default 'python',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Row Level Security (RLS) - This is the MAGIC that separates Admin from Users!
alter table public.files enable row level security;

-- Policy 1: Users can see and edit THEIR OWN files
create policy "Users can manage their own files"
on public.files
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy 2: The Admin can see and edit EVERYONE'S files
create policy "Admin has full access"
on public.files
for all
to authenticated
using (auth.jwt() ->> 'email' = 'manghosh7@gmail.com')
with check (auth.jwt() ->> 'email' = 'manghosh7@gmail.com');
