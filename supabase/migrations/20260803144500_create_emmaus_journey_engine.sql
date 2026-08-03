create table if not exists public.emmaus_discovery_catalog (
  discovery_id text primary key,
  pack_id text not null,
  title text not null,
  passage text not null,
  subtitle text,
  estimated_minutes integer not null default 30 check (estimated_minutes > 0),
  skill_focus text[] not null default '{}',
  graph_node_key text references public.emmaus_graph_nodes(node_key) on delete set null,
  status text not null default 'reviewed' check (status in ('draft', 'reviewed', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.emmaus_discovery_catalog enable row level security;

create policy "Authenticated users can view published Emmaus discoveries"
on public.emmaus_discovery_catalog
for select
to authenticated
using (status in ('reviewed', 'published'));

create index if not exists emmaus_discovery_catalog_status_idx
on public.emmaus_discovery_catalog (status);

create index if not exists emmaus_discovery_catalog_skills_idx
on public.emmaus_discovery_catalog using gin (skill_focus);

create table if not exists public.emmaus_journey_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_minutes integer,
  preferred_skills text[] not null default '{}',
  preferred_topics text[] not null default '{}',
  avoid_topics text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.emmaus_journey_preferences enable row level security;

create policy "Users can view their own Emmaus journey preferences"
on public.emmaus_journey_preferences
for select
using (auth.uid() = user_id);

create policy "Users can create their own Emmaus journey preferences"
on public.emmaus_journey_preferences
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own Emmaus journey preferences"
on public.emmaus_journey_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.get_emmaus_journey_recommendations(p_limit integer default 5)
returns table (
  discovery_id text,
  pack_id text,
  title text,
  passage text,
  subtitle text,
  estimated_minutes integer,
  recommendation_score numeric,
  reason text,
  reason_type text,
  growth_skill text
)
language sql
stable
security invoker
set search_path = public
as $$
  with user_state as (
    select auth.uid() as user_id
  ),
  completed as (
    select p.discovery_id, p.updated_at
    from public.emmaus_discovery_progress p, user_state u
    where p.user_id = u.user_id and p.is_completed = true
  ),
  active as (
    select p.discovery_id, p.updated_at
    from public.emmaus_discovery_progress p, user_state u
    where p.user_id = u.user_id and p.is_completed = false
  ),
  latest_completed as (
    select c.discovery_id, d.graph_node_key
    from completed c
    join public.emmaus_discovery_catalog d on d.discovery_id = c.discovery_id
    order by c.updated_at desc
    limit 1
  ),
  skill_evidence as (
    select
      skill,
      count(*)::numeric as exposures,
      sum(case when p.is_completed then 1 else 0.4 end)::numeric as completed_weight
    from public.emmaus_discovery_progress p
    join public.emmaus_discovery_catalog d on d.discovery_id = p.discovery_id
    cross join unnest(d.skill_focus) as skill
    join user_state u on p.user_id = u.user_id
    group by skill
  ),
  growth_skill as (
    select skill
    from skill_evidence
    order by (completed_weight / nullif(exposures, 0)) asc, exposures asc
    limit 1
  ),
  graph_candidates as (
    select distinct
      candidate.discovery_id,
      greatest(edge.confidence_score, 0)::numeric / 100 as graph_strength
    from latest_completed lc
    join public.emmaus_graph_nodes source on source.node_key = lc.graph_node_key
    join public.emmaus_graph_edges edge
      on edge.status = 'published'
      and (edge.source_node_id = source.id or edge.target_node_id = source.id)
    join public.emmaus_graph_nodes neighbor
      on neighbor.id = case when edge.source_node_id = source.id then edge.target_node_id else edge.source_node_id end
    join public.emmaus_discovery_catalog candidate on candidate.graph_node_key = neighbor.node_key
  ),
  prefs as (
    select *
    from public.emmaus_journey_preferences jp, user_state u
    where jp.user_id = u.user_id
  ),
  ranked as (
    select
      d.discovery_id,
      d.pack_id,
      d.title,
      d.passage,
      d.subtitle,
      d.estimated_minutes,
      (
        40
        + case when a.discovery_id is not null then 35 else 0 end
        + coalesce(gc.graph_strength * 25, 0)
        + case when gs.skill is not null and gs.skill = any(d.skill_focus) then 20 else 0 end
        + case when pr.preferred_minutes is not null and abs(d.estimated_minutes - pr.preferred_minutes) <= 10 then 8 else 0 end
        + case when pr.preferred_skills && d.skill_focus then 8 else 0 end
      )::numeric as recommendation_score,
      case
        when a.discovery_id is not null then 'Continue this discovery where you left off.'
        when gc.discovery_id is not null then 'This discovery follows a strong connection from your most recent completed study.'
        when gs.skill is not null and gs.skill = any(d.skill_focus) then 'This discovery strengthens a less-practiced study skill.'
        else 'This is an available reviewed discovery that broadens your current journey.'
      end as reason,
      case
        when a.discovery_id is not null then 'resume'
        when gc.discovery_id is not null then 'graph'
        when gs.skill is not null and gs.skill = any(d.skill_focus) then 'growth'
        else 'explore'
      end as reason_type,
      case when gs.skill is not null and gs.skill = any(d.skill_focus) then gs.skill else null end as growth_skill,
      coalesce(a.updated_at, timestamp '1970-01-01') as active_updated
    from public.emmaus_discovery_catalog d
    left join completed c on c.discovery_id = d.discovery_id
    left join active a on a.discovery_id = d.discovery_id
    left join graph_candidates gc on gc.discovery_id = d.discovery_id
    left join growth_skill gs on true
    left join prefs pr on true
    where d.status in ('reviewed', 'published')
      and c.discovery_id is null
  )
  select
    r.discovery_id,
    r.pack_id,
    r.title,
    r.passage,
    r.subtitle,
    r.estimated_minutes,
    r.recommendation_score,
    r.reason,
    r.reason_type,
    r.growth_skill
  from ranked r
  order by
    case when r.reason_type = 'resume' then 0 else 1 end,
    r.recommendation_score desc,
    r.active_updated desc,
    r.title
  limit greatest(1, least(coalesce(p_limit, 5), 12));
$$;

grant execute on function public.get_emmaus_journey_recommendations(integer) to authenticated;

create or replace function public.set_emmaus_journey_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_emmaus_discovery_catalog_updated_at on public.emmaus_discovery_catalog;
create trigger set_emmaus_discovery_catalog_updated_at
before update on public.emmaus_discovery_catalog
for each row execute function public.set_emmaus_journey_updated_at();

drop trigger if exists set_emmaus_journey_preferences_updated_at on public.emmaus_journey_preferences;
create trigger set_emmaus_journey_preferences_updated_at
before update on public.emmaus_journey_preferences
for each row execute function public.set_emmaus_journey_updated_at();
