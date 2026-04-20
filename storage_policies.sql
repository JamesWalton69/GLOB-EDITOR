-- Note: Row Level Security is already enabled by default on storage.objects in Supabase.

-- Drop previous policies if you are running this again just in case
drop policy if exists "Admin has full access" on storage.objects;
drop policy if exists "Users can manage their own files" on storage.objects;

-- POLICY 1: Admins can do EVERYTHING in the 'editor_files' bucket
create policy "Admin has full access"
on storage.objects
for all
to authenticated
using ( bucket_id = 'editor_files' AND auth.jwt() ->> 'email' = 'manghosh7@gmail.com' )
with check ( bucket_id = 'editor_files' AND auth.jwt() ->> 'email' = 'manghosh7@gmail.com' );

-- POLICY 2: Users can view, create, update, and delete files inside THEIR OWN folder
-- The folder name is exactly their uid (e.g., '123-abc/test.py') 
-- so we check if the storage path starts with their uid.
create policy "Users can manage their own files"
on storage.objects
for all
to authenticated
using ( bucket_id = 'editor_files' AND (storage.foldername(name))[1] = auth.uid()::text )
with check ( bucket_id = 'editor_files' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Just in case the bucket wasn't created perfectly before, ensure it exists:
insert into storage.buckets (id, name, public) 
values ('editor_files', 'editor_files', false)
on conflict do nothing;
