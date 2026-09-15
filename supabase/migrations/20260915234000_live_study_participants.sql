create table if not exists public.study_session_participants (
  study_session_id uuid not null references public.study_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (study_session_id, user_id)
);
create index if not exists study_session_participants_user_idx on public.study_session_participants(user_id, assigned_at desc);
alter table public.study_session_participants enable row level security;
create policy "participants read own live study assignments" on public.study_session_participants for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "admins manage live study participants" on public.study_session_participants for all to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
