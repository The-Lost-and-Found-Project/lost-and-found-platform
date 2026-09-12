create table if not exists public.content_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  content_type text not null check (content_type in ('study','devotional','trivia','audio','video','series','collection')),
  provenance text not null default 'lfp_original' check (provenance in ('lfp_original','lfp_approved','emmaus')),
  author_name text,
  source_name text,
  scripture_refs text[] not null default '{}',
  topics text[] not null default '{}',
  audience text[] not null default '{}',
  duration_minutes integer,
  difficulty text check (difficulty is null or difficulty in ('beginner','intermediate','advanced','all')),
  external_url text,
  artwork_url text,
  body text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_catalog_published_idx on public.content_catalog (is_published, published_at desc);
create index if not exists content_catalog_type_idx on public.content_catalog (content_type);
create index if not exists content_catalog_provenance_idx on public.content_catalog (provenance);

alter table public.content_catalog enable row level security;

drop policy if exists "Members read published catalog" on public.content_catalog;
create policy "Members read published catalog" on public.content_catalog
for select to authenticated using (is_published = true or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "Admins manage catalog" on public.content_catalog;
create policy "Admins manage catalog" on public.content_catalog
for all to authenticated using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
)) with check (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

create table if not exists public.content_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.content_catalog(id) on delete cascade,
  status text not null default 'saved' check (status in ('saved','started','completed')),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  last_position_seconds integer,
  updated_at timestamptz not null default now(),
  unique(user_id, content_id)
);

alter table public.content_progress enable row level security;

drop policy if exists "Users manage own content progress" on public.content_progress;
create policy "Users manage own content progress" on public.content_progress
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
