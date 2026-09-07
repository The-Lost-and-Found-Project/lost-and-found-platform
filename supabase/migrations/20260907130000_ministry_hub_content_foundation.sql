create table if not exists public.ministry_content (
  id uuid primary key default gen_random_uuid(),
  ministry_slug text not null check (ministry_slug in ('hearth','foundry','mens-study')),
  content_type text not null check (content_type in ('announcement','resource','gathering','study','serve')),
  title text not null,
  summary text,
  body text,
  link_url text,
  starts_at timestamptz,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ministry_content_portal_idx on public.ministry_content(ministry_slug, is_published, content_type, sort_order, created_at desc);
alter table public.ministry_content enable row level security;
create policy "members read published ministry content" on public.ministry_content for select to authenticated using (is_published = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admins insert ministry content" on public.ministry_content for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admins update ministry content" on public.ministry_content for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admins delete ministry content" on public.ministry_content for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
