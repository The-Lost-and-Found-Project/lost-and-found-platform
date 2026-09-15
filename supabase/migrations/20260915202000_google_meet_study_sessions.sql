-- Live Bible-study gatherings are session instances, separate from reusable study content.
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  bible_study_id uuid not null references public.bible_studies(id) on delete cascade,
  ministry_slug text not null check (ministry_slug in ('hearth','foundry','mens-study')),
  facilitator_user_id uuid references auth.users(id) on delete set null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  status text not null default 'scheduled' check (status in ('draft','scheduled','live','completed','cancelled')),
  google_space_name text,
  google_meeting_code text,
  google_meeting_uri text,
  google_organizer_email text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_sessions_schedule_valid check (scheduled_end is null or scheduled_end > scheduled_start)
);

create unique index if not exists study_sessions_google_space_name_uidx
  on public.study_sessions(google_space_name)
  where google_space_name is not null;
create index if not exists study_sessions_study_start_idx
  on public.study_sessions(bible_study_id, scheduled_start);
create index if not exists study_sessions_facilitator_start_idx
  on public.study_sessions(facilitator_user_id, scheduled_start)
  where facilitator_user_id is not null;

alter table public.study_sessions enable row level security;

-- Initial policy intentionally mirrors the current bible_studies access model.
-- Ministry/group membership restrictions can be layered on when group enrollment
-- tables become the canonical source of truth.
create policy "members read scheduled study sessions"
  on public.study_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bible_studies bs
      where bs.id = bible_study_id
        and bs.is_published = true
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "admins manage study sessions"
  on public.study_sessions
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

comment on table public.study_sessions is
  'Scheduled/live instances of reusable L&F Bible studies. Google Meet metadata belongs here rather than on bible_studies.';
