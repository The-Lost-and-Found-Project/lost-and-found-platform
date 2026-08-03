create table if not exists public.emmaus_adaptive_branch_visits (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.emmaus_walk_sessions(id) on delete cascade,
  source_step_id uuid not null references public.emmaus_discovery_path_steps(id) on delete cascade,
  source_node_id uuid not null references public.emmaus_graph_nodes(id) on delete cascade,
  target_node_id uuid not null references public.emmaus_graph_nodes(id) on delete cascade,
  relationship_key text not null,
  adaptive_score integer not null default 0,
  reason text,
  status text not null default 'opened' check (status in ('opened','completed','returned')),
  opened_at timestamptz not null default now(),
  completed_at timestamptz,
  returned_at timestamptz
);

create index if not exists emmaus_adaptive_branch_visits_session_idx
  on public.emmaus_adaptive_branch_visits(session_id, opened_at desc);

alter table public.emmaus_adaptive_branch_visits enable row level security;

create policy "Users manage adaptive branches for their own sessions"
on public.emmaus_adaptive_branch_visits for all
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
