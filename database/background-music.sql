-- Chạy một lần trong Supabase SQL Editor cho project đã tồn tại.
-- schema.sql cũng bao gồm các khai báo này cho project mới.
create table if not exists public.site_settings (
  key text primary key check (key = 'background_music'),
  title text not null default 'L’AURA Ambient',
  audio_url text not null,
  storage_path text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
drop policy if exists "Public reads site settings" on public.site_settings;
create policy "Public reads site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings for all to authenticated
using (public.is_admin()) with check (public.is_admin());
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-audio', 'site-audio', true, 15728640, array['audio/mpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload site audio" on storage.objects;
create policy "Admins upload site audio" on storage.objects for insert to authenticated
with check (bucket_id = 'site-audio' and public.is_admin());
drop policy if exists "Admins delete site audio" on storage.objects;
create policy "Admins delete site audio" on storage.objects for delete to authenticated
using (bucket_id = 'site-audio' and public.is_admin());
