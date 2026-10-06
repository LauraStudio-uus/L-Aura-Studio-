create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.concepts (
  slug text primary key,
  title text not null,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.concept_images (
  id uuid primary key default gen_random_uuid(),
  concept_slug text not null references public.concepts(slug) on delete cascade,
  image_url text not null,
  storage_path text,
  position integer not null default 0 check (position >= 0 and position < 20),
  created_at timestamptz not null default now()
);
create index if not exists concept_images_concept_position_idx
  on public.concept_images(concept_slug, position);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  phone text not null check (char_length(phone) between 6 and 30),
  service text,
  preferred_date date,
  message text check (message is null or char_length(message) <= 2000),
  status text not null default 'new' check (status in ('new','read','contacted','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  page text not null default 'portfolio',
  image_url text not null,
  layout text not null default 'normal',
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.portfolio_items add column if not exists page text not null default 'portfolio';

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text,
  excerpt text,
  content text,
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_name text not null,
  body text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.concepts (slug, title, label) values
  ('angelic', 'Angelic / Ethereal', 'Thiên thần / Thần thoại'),
  ('dark-gothic', 'Dark / Gothic', 'Bóng tối / Huyền bí'),
  ('floral-muse', 'Floral / Muse', 'Nàng thơ / Hoa cỏ'),
  ('fairy-pastoral', 'Fairy / Pastoral', 'Cổ tích / Dã ngoại'),
  ('high-fashion', 'High Fashion / Glamour', 'Thời trang cao cấp'),
  ('oriental-period', 'Oriental / Period', 'Cổ trang / Cổ phục')
on conflict (slug) do update set title = excluded.title, label = excluded.label;

alter table public.admin_users enable row level security;
alter table public.concepts enable row level security;
alter table public.concept_images enable row level security;
alter table public.bookings enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Public reads concepts" on public.concepts;
create policy "Public reads concepts" on public.concepts for select using (true);
drop policy if exists "Admins manage concepts" on public.concepts;
create policy "Admins manage concepts" on public.concepts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads concept images" on public.concept_images;
create policy "Public reads concept images" on public.concept_images for select using (true);
drop policy if exists "Admins manage concept images" on public.concept_images;
create policy "Admins manage concept images" on public.concept_images for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Anyone creates booking" on public.bookings;
create policy "Anyone creates booking" on public.bookings for insert to anon, authenticated
with check (char_length(name) between 2 and 100 and char_length(phone) between 6 and 30 and status = 'new');
drop policy if exists "Admins read bookings" on public.bookings;
create policy "Admins read bookings" on public.bookings for select using (public.is_admin());
drop policy if exists "Admins update bookings" on public.bookings;
create policy "Admins update bookings" on public.bookings for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete bookings" on public.bookings;
create policy "Admins delete bookings" on public.bookings for delete using (public.is_admin());

drop policy if exists "Public reads portfolio" on public.portfolio_items;
create policy "Public reads portfolio" on public.portfolio_items for select using (published or public.is_admin());
drop policy if exists "Admins manage portfolio" on public.portfolio_items;
create policy "Admins manage portfolio" on public.portfolio_items for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads posts" on public.posts;
create policy "Public reads posts" on public.posts for select using (published or public.is_admin());
drop policy if exists "Admins manage posts" on public.posts;
create policy "Admins manage posts" on public.posts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads approved comments" on public.comments;
create policy "Public reads approved comments" on public.comments for select using (approved or public.is_admin());
drop policy if exists "Admins manage comments" on public.comments;
create policy "Admins manage comments" on public.comments for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('concept-images', 'concept-images', true, 12582912, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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

drop policy if exists "Admins upload concept images" on storage.objects;
create policy "Admins upload concept images" on storage.objects for insert to authenticated
with check (bucket_id = 'concept-images' and public.is_admin());
drop policy if exists "Admins update concept images" on storage.objects;
create policy "Admins update concept images" on storage.objects for update to authenticated
using (bucket_id = 'concept-images' and public.is_admin())
with check (bucket_id = 'concept-images' and public.is_admin());
drop policy if exists "Admins delete concept images" on storage.objects;
create policy "Admins delete concept images" on storage.objects for delete to authenticated
using (bucket_id = 'concept-images' and public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.concepts, public.concept_images, public.portfolio_items, public.posts, public.comments to anon, authenticated;
grant insert on public.bookings to anon, authenticated;
grant select, insert, update, delete on public.concepts, public.concept_images, public.bookings, public.portfolio_items, public.posts, public.comments to authenticated;

-- Nhạc nền của website
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
