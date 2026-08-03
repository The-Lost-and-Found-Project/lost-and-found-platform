create table if not exists public.emmaus_walk_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path_id uuid not null references public.emmaus_discovery_paths(id) on delete cascade,
  current_step_key text,
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  earned_xp integer not null default 0 check (earned_xp >= 0),
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id, path_id)
);

create table if not exists public.emmaus_walk_step_progress (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.emmaus_walk_sessions(id) on delete cascade,
  step_id uuid not null references public.emmaus_discovery_path_steps(id) on delete cascade,
  observation_response text,
  connection_response text,
  reflection_response text,
  journal_entry text,
  prayer_response text,
  completed boolean not null default false,
  xp_awarded integer not null default 0 check (xp_awarded >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(session_id, step_id)
);

create index if not exists emmaus_walk_sessions_user_idx on public.emmaus_walk_sessions(user_id, last_activity_at desc);
create index if not exists emmaus_walk_progress_session_idx on public.emmaus_walk_step_progress(session_id, updated_at desc);

alter table public.emmaus_walk_sessions enable row level security;
alter table public.emmaus_walk_step_progress enable row level security;

create policy "Users manage their own Emmaus walk sessions"
on public.emmaus_walk_sessions for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users manage progress for their own Emmaus walk sessions"
on public.emmaus_walk_step_progress for all
to authenticated
using (
  exists (
    select 1 from public.emmaus_walk_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.emmaus_walk_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  )
);
