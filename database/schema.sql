create extension if not exists pgcrypto;

create table if not exists concepts (
  slug text primary key,
  title text not null,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists concept_images (
  id uuid primary key default gen_random_uuid(),
  concept_slug text not null references concepts(slug) on delete cascade,
  image_url text not null,
  storage_path text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists concept_images_concept_position_idx on concept_images(concept_slug, position);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  service text,
  preferred_date date,
  message text,
  status text not null default 'new' check (status in ('new','read','contacted','closed')),
  created_at timestamptz not null default now()
);

create table if not exists portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  image_url text not null,
  layout text not null default 'normal',
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists posts (
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

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_name text not null,
  body text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

insert into concepts (slug, title, label) values
  ('angelic', 'Angelic / Ethereal', 'Thiên thần / Thần thoại'),
  ('dark-gothic', 'Dark / Gothic', 'Bóng tối / Huyền bí'),
  ('floral-muse', 'Floral / Muse', 'Nàng thơ / Hoa cỏ'),
  ('fairy-pastoral', 'Fairy / Pastoral', 'Cổ tích / Dã ngoại'),
  ('high-fashion', 'High Fashion / Glamour', 'Thời trang cao cấp'),
  ('oriental-period', 'Oriental / Period', 'Cổ trang / Cổ phục')
on conflict (slug) do update set title = excluded.title, label = excluded.label;
