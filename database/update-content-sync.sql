-- Chạy một lần trong SQL Editor nếu project đã cài database/schema.sql trước đây.
alter table public.portfolio_items add column if not exists page text not null default 'portfolio';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 12582912, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload site images" on storage.objects;
create policy "Admins upload site images" on storage.objects for insert to authenticated
with check (bucket_id = 'site-images' and public.is_admin());
drop policy if exists "Admins delete site images" on storage.objects;
create policy "Admins delete site images" on storage.objects for delete to authenticated
using (bucket_id = 'site-images' and public.is_admin());
