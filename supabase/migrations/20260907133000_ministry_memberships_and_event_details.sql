alter table public.ministry_content add column if not exists location text;
alter table public.ministry_content add column if not exists ends_at timestamptz;
alter table public.ministry_content add column if not exists action_label text;
create table if not exists public.ministry_memberships (
 id uuid primary key default gen_random_uuid(),
 ministry_slug text not null check (ministry_slug in ('hearth','foundry','mens-study')),
 user_id uuid not null references auth.users(id) on delete cascade,
 membership_role text not null default 'member' check (membership_role in ('member','leader')),
 created_at timestamptz not null default now(), unique(ministry_slug,user_id)
);
alter table public.ministry_memberships enable row level security;
create policy "members read ministry memberships" on public.ministry_memberships for select to authenticated using (user_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "members join ministries" on public.ministry_memberships for insert to authenticated with check (user_id=auth.uid() and membership_role='member');
create policy "members leave ministries" on public.ministry_memberships for delete to authenticated using (user_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "admins update ministry memberships" on public.ministry_memberships for update to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create index if not exists ministry_memberships_user_idx on public.ministry_memberships(user_id,ministry_slug);
