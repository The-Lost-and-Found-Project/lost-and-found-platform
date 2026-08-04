create table if not exists public.emmaus_graph_exploration_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id uuid not null references public.emmaus_graph_nodes(id) on delete cascade,
  source_node_id uuid references public.emmaus_graph_nodes(id) on delete set null,
  relationship_key text references public.emmaus_relationship_types(key) on delete set null,
  visit_count integer not null default 1 check (visit_count > 0),
  first_visited_at timestamptz not null default now(),
  last_visited_at timestamptz not null default now(),
  discovery_depth integer not null default 0 check (discovery_depth >= 0),
  metadata jsonb not null default '{}'::jsonb,
  unique(user_id,node_id)
);

create index if not exists emmaus_graph_exploration_visits_user_idx
  on public.emmaus_graph_exploration_visits(user_id,last_visited_at desc);
create index if not exists emmaus_graph_exploration_visits_node_idx
  on public.emmaus_graph_exploration_visits(node_id,user_id);

alter table public.emmaus_graph_exploration_visits enable row level security;

create policy "Users read their own graph exploration history"
on public.emmaus_graph_exploration_visits for select
to authenticated
using (user_id=auth.uid());

create policy "Users create their own graph exploration history"
on public.emmaus_graph_exploration_visits for insert
to authenticated
with check (user_id=auth.uid());

create policy "Users update their own graph exploration history"
on public.emmaus_graph_exploration_visits for update
to authenticated
using (user_id=auth.uid())
with check (user_id=auth.uid());

create or replace function public.record_emmaus_graph_visit(
  p_node_key text,
  p_source_node_key text default null,
  p_relationship_key text default null,
  p_discovery_depth integer default 0,
  p_metadata jsonb default '{}'::jsonb
)
returns public.emmaus_graph_exploration_visits
language plpgsql
security definer
set search_path=public
as $$
declare
  target_node_id uuid;
  source_id uuid;
  result_row public.emmaus_graph_exploration_visits;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select id into target_node_id
  from public.emmaus_graph_nodes
  where node_key=p_node_key and status='published';

  if target_node_id is null then raise exception 'Published graph node not found'; end if;

  if p_source_node_key is not null then
    select id into source_id
    from public.emmaus_graph_nodes
    where node_key=p_source_node_key and status='published';
  end if;

  insert into public.emmaus_graph_exploration_visits(
    user_id,node_id,source_node_id,relationship_key,discovery_depth,metadata
  ) values (
    auth.uid(),target_node_id,source_id,p_relationship_key,greatest(coalesce(p_discovery_depth,0),0),coalesce(p_metadata,'{}'::jsonb)
  )
  on conflict(user_id,node_id) do update set
    visit_count=public.emmaus_graph_exploration_visits.visit_count+1,
    last_visited_at=now(),
    source_node_id=coalesce(excluded.source_node_id,public.emmaus_graph_exploration_visits.source_node_id),
    relationship_key=coalesce(excluded.relationship_key,public.emmaus_graph_exploration_visits.relationship_key),
    discovery_depth=greatest(public.emmaus_graph_exploration_visits.discovery_depth,excluded.discovery_depth),
    metadata=public.emmaus_graph_exploration_visits.metadata||excluded.metadata
  returning * into result_row;

  return result_row;
end;
$$;

grant execute on function public.record_emmaus_graph_visit(text,text,text,integer,jsonb) to authenticated;

create or replace function public.get_emmaus_living_galaxy(
  p_limit integer default 120
)
returns table(
  node_id uuid,
  node_key text,
  node_type text,
  title text,
  scripture_reference text,
  visit_count integer,
  discovery_depth integer,
  first_visited_at timestamptz,
  last_visited_at timestamptz,
  source_node_id uuid,
  relationship_key text
)
language sql
stable
security invoker
set search_path=public
as $$
  select
    n.id,
    n.node_key,
    n.node_type,
    n.title,
    n.scripture_reference,
    v.visit_count,
    v.discovery_depth,
    v.first_visited_at,
    v.last_visited_at,
    v.source_node_id,
    v.relationship_key
  from public.emmaus_graph_exploration_visits v
  join public.emmaus_graph_nodes n on n.id=v.node_id
  where v.user_id=auth.uid() and n.status='published'
  order by v.last_visited_at desc
  limit greatest(1,least(coalesce(p_limit,120),500));
$$;

grant execute on function public.get_emmaus_living_galaxy(integer) to authenticated;
