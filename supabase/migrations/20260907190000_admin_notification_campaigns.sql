create table if not exists public.notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  link text,
  audience_type text not null check (audience_type in ('all','ministry','leaders','prayer_team','admins')),
  audience_value text,
  created_by uuid references auth.users(id) on delete set null,
  recipient_count integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.notification_campaigns enable row level security;
create policy "admins read notification campaigns" on public.notification_campaigns for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "admins insert notification campaigns" on public.notification_campaigns for insert to authenticated with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
alter table public.notifications add column if not exists campaign_id uuid references public.notification_campaigns(id) on delete set null;
create index if not exists notifications_campaign_idx on public.notifications(campaign_id, created_at desc);
