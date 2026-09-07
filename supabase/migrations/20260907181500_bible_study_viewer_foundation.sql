create table if not exists public.bible_studies (
  id uuid primary key default gen_random_uuid(),
  ministry_slug text check (ministry_slug in ('hearth','foundry','mens-study')),
  title text not null,
  subtitle text,
  description text,
  scripture_refs text[] not null default '{}',
  slides jsonb not null default '[]'::jsonb,
  devotional_cards jsonb not null default '[]'::jsonb,
  meeting_url text,
  downloadable_url text,
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bible_studies enable row level security;
create policy "members read published bible studies" on public.bible_studies for select to authenticated using (is_published = true or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "admins manage bible studies" on public.bible_studies for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create index if not exists bible_studies_published_idx on public.bible_studies(is_published, created_at desc);
