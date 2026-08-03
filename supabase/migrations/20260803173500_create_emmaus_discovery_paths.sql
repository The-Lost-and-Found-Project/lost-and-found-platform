create table if not exists public.emmaus_discovery_paths (
  id uuid primary key default gen_random_uuid(),
  path_key text not null unique,
  title text not null,
  subtitle text,
  description text not null,
  learning_objective text not null,
  starting_node_id uuid references public.emmaus_graph_nodes(id) on delete set null,
  difficulty text not null default 'growing' check (difficulty in ('explorer','growing','deep','mentor')),
  mode text not null default 'guided' check (mode in ('explorer','guided','challenge','group','mentor')),
  estimated_minutes integer not null default 30 check (estimated_minutes > 0),
  completion_xp integer not null default 100 check (completion_xp >= 0),
  completion_requirements jsonb not null default '{}'::jsonb,
  mentor_notes text,
  status text not null default 'draft' check (status in ('draft','reviewed','published','archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emmaus_discovery_path_steps (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.emmaus_discovery_paths(id) on delete cascade,
  step_key text not null,
  graph_node_id uuid not null references public.emmaus_graph_nodes(id) on delete restrict,
  position integer not null,
  step_type text not null default 'primary' check (step_type in ('primary','optional','branch','challenge','checkpoint')),
  branch_label text,
  prerequisite_step_keys text[] not null default '{}',
  observation_prompt text,
  connection_prompt text,
  reflection_prompt text,
  journaling_prompt text,
  mentor_note text,
  xp_reward integer not null default 10 check (xp_reward >= 0),
  is_completion_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(path_id, step_key),
  unique(path_id, position)
);

create index if not exists emmaus_discovery_paths_status_idx on public.emmaus_discovery_paths(status, updated_at desc);
create index if not exists emmaus_discovery_path_steps_path_idx on public.emmaus_discovery_path_steps(path_id, position);
create index if not exists emmaus_discovery_path_steps_node_idx on public.emmaus_discovery_path_steps(graph_node_id);

alter table public.emmaus_discovery_paths enable row level security;
alter table public.emmaus_discovery_path_steps enable row level security;

create policy "Published discovery paths are readable"
on public.emmaus_discovery_paths for select
to authenticated
using (status = 'published' or public.is_emmaus_admin());

create policy "Admins manage discovery paths"
on public.emmaus_discovery_paths for all
to authenticated
using (public.is_emmaus_admin())
with check (public.is_emmaus_admin());

create policy "Published discovery path steps are readable"
on public.emmaus_discovery_path_steps for select
to authenticated
using (
  exists (
    select 1 from public.emmaus_discovery_paths p
    where p.id = path_id and (p.status = 'published' or public.is_emmaus_admin())
  )
);

create policy "Admins manage discovery path steps"
on public.emmaus_discovery_path_steps for all
to authenticated
using (public.is_emmaus_admin())
with check (public.is_emmaus_admin());
