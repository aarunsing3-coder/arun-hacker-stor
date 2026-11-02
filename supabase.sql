-- Run this entire script in Supabase > SQL Editor.
-- Create a PUBLIC bucket for downloads; only authenticated admin can upload/delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app-files',
  'app-files',
  true,
  104857600,
  array['application/vnd.android.package-archive','application/zip','application/octet-stream']
)
on conflict (id) do update set public = true, file_size_limit = 104857600;

create table if not exists public.apps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  version text not null default '1.0',
  category text not null default 'Other',
  description text not null default '',
  storage_path text not null,
  file_name text not null,
  file_type text not null check (file_type in ('APK','ZIP')),
  file_size bigint not null default 0,
  downloads bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.apps enable row level security;

drop policy if exists "Public can view apps" on public.apps;
create policy "Public can view apps" on public.apps for select using (true);

drop policy if exists "Admin can add apps" on public.apps;
create policy "Admin can add apps" on public.apps for insert to authenticated with check (true);

drop policy if exists "Admin can update apps" on public.apps;
create policy "Admin can update apps" on public.apps for update to authenticated using (true) with check (true);

drop policy if exists "Admin can delete apps" on public.apps;
create policy "Admin can delete apps" on public.apps for delete to authenticated using (true);

-- Public can download files from the public bucket.
drop policy if exists "Public can read app files" on storage.objects;
create policy "Public can read app files" on storage.objects for select using (bucket_id = 'app-files');

-- Only signed-in users can upload, replace or delete files.
drop policy if exists "Admin can upload app files" on storage.objects;
create policy "Admin can upload app files" on storage.objects for insert to authenticated with check (bucket_id = 'app-files');

drop policy if exists "Admin can update app files" on storage.objects;
create policy "Admin can update app files" on storage.objects for update to authenticated using (bucket_id = 'app-files') with check (bucket_id = 'app-files');

drop policy if exists "Admin can delete app files" on storage.objects;
create policy "Admin can delete app files" on storage.objects for delete to authenticated using (bucket_id = 'app-files');

-- Increment download counter without allowing public users to edit app records.
create or replace function public.increment_download_count(p_app_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.apps set downloads = downloads + 1 where id = p_app_id;
$$;

grant execute on function public.increment_download_count(uuid) to anon, authenticated;
