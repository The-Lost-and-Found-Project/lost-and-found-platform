create table if not exists public.emmaus_companion_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.emmaus_walk_sessions(id) on delete cascade,
  step_id uuid not null references public.emmaus_discovery_path_steps(id) on delete cascade,
  role text not null check (role in ('companion','learner')),
  message_type text not null default 'question' check (message_type in ('question','response','nudge','cross_reference','context','insight')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists emmaus_companion_messages_session_step_idx
  on public.emmaus_companion_messages(session_id, step_id, created_at);

alter table public.emmaus_companion_messages enable row level security;

create policy "Users manage companion messages for their sessions"
on public.emmaus_companion_messages for all
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
