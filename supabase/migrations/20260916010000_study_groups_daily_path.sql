create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  ministry_slug text not null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.study_group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  group_role text not null default 'member' check (group_role in ('member','facilitator')),
  membership_status text not null default 'active' check (membership_status in ('active','inactive')),
  joined_at timestamptz not null default now(),
  primary key (group_id,user_id)
);
alter table public.study_sessions add column if not exists group_id uuid references public.study_groups(id) on delete set null;
create index if not exists study_sessions_group_idx on public.study_sessions(group_id,scheduled_start desc);

create table if not exists public.study_daily_progress (
  study_session_id uuid not null references public.study_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 31),
  opened_at timestamptz,
  completed_at timestamptz,
  primary key (study_session_id,user_id,day_number)
);

create table if not exists public.study_daily_responses (
  id uuid primary key default gen_random_uuid(),
  study_session_id uuid not null references public.study_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 31),
  response_type text not null check (response_type in ('private_journal','group_response','personal_reflection')),
  response_text text not null default '',
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (study_session_id,user_id,day_number,response_type)
);
create index if not exists study_daily_responses_session_day_idx on public.study_daily_responses(study_session_id,day_number,response_type);

create or replace function public.prevent_locked_group_response_change() returns trigger language plpgsql as $$
begin
  if old.response_type='group_response' and old.locked_at is not null and (new.response_text is distinct from old.response_text or new.locked_at is distinct from old.locked_at) then
    raise exception 'Locked group responses cannot be edited';
  end if;
  new.updated_at=now();
  return new;
end;
$$;
drop trigger if exists trg_prevent_locked_group_response_change on public.study_daily_responses;
create trigger trg_prevent_locked_group_response_change before update on public.study_daily_responses for each row execute function public.prevent_locked_group_response_change();

alter table public.study_groups enable row level security;
alter table public.study_group_members enable row level security;
alter table public.study_daily_progress enable row level security;
alter table public.study_daily_responses enable row level security;

create policy "study group members can view their groups" on public.study_groups for select to authenticated using (
  exists(select 1 from public.study_group_members gm where gm.group_id=id and gm.user_id=auth.uid() and gm.membership_status='active')
  or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
);
create policy "admins manage study groups" on public.study_groups for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "members see their group membership" on public.study_group_members for select to authenticated using (user_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "admins manage group membership" on public.study_group_members for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

create policy "participants manage own daily progress" on public.study_daily_progress for all to authenticated using (
 user_id=auth.uid() and exists(select 1 from public.study_session_participants sp where sp.study_session_id=study_daily_progress.study_session_id and sp.user_id=auth.uid())
) with check (
 user_id=auth.uid() and exists(select 1 from public.study_session_participants sp where sp.study_session_id=study_daily_progress.study_session_id and sp.user_id=auth.uid())
);

create policy "participants insert own daily responses" on public.study_daily_responses for insert to authenticated with check (
 user_id=auth.uid() and exists(select 1 from public.study_session_participants sp where sp.study_session_id=study_daily_responses.study_session_id and sp.user_id=auth.uid())
);
create policy "participants update own unlocked responses" on public.study_daily_responses for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "participants read own or revealed group responses" on public.study_daily_responses for select to authenticated using (
 user_id=auth.uid()
 or (
   response_type='group_response'
   and exists(select 1 from public.study_session_participants me where me.study_session_id=study_daily_responses.study_session_id and me.user_id=auth.uid())
   and exists(select 1 from public.study_daily_responses mine where mine.study_session_id=study_daily_responses.study_session_id and mine.user_id=auth.uid() and mine.day_number=study_daily_responses.day_number and mine.response_type='group_response' and mine.locked_at is not null)
 )
 or exists(select 1 from public.study_sessions ss where ss.id=study_daily_responses.study_session_id and ss.facilitator_user_id=auth.uid())
 or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
);
