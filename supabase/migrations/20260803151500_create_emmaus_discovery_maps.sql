create table if not exists public.emmaus_discovery_maps (
  id uuid primary key default gen_random_uuid(),
  map_key text not null unique,
  title text not null,
  subtitle text,
  description text not null,
  cover_icon text not null default '🧭',
  theme_node_key text references public.emmaus_graph_nodes(node_key) on delete set null,
  difficulty text not null default 'growing' check (difficulty in ('explorer', 'growing', 'deep', 'mentor')),
  estimated_minutes integer not null default 120 check (estimated_minutes > 0),
  completion_xp integer not null default 100 check (completion_xp >= 0),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emmaus_discovery_map_stops (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.emmaus_discovery_maps(id) on delete cascade,
  stop_key text not null,
  discovery_id text not null references public.emmaus_discovery_catalog(discovery_id) on delete restrict,
  position integer not null check (position > 0),
  stop_type text not null default 'required' check (stop_type in ('required', 'optional', 'branch', 'challenge')),
  branch_label text,
  prerequisite_stop_keys text[] not null default '{}',
  unlock_condition jsonb not null default '{}'::jsonb,
  transition_prompt text,
  reflection_prompt text,
  metadata jsonb not null default '{}'::jsonb,
  unique (map_id, stop_key),
  unique (map_id, position, stop_key)
);

create table if not exists public.emmaus_user_map_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  map_id uuid not null references public.emmaus_discovery_maps(id) on delete cascade,
  current_stop_key text,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  is_completed boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, map_id)
);

create table if not exists public.emmaus_user_map_stop_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  map_stop_id uuid not null references public.emmaus_discovery_map_stops(id) on delete cascade,
  status text not null default 'available' check (status in ('locked', 'available', 'in_progress', 'completed', 'skipped')),
  started_at timestamptz,
  completed_at timestamptz,
  reflection_response text,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, map_stop_id)
);

alter table public.emmaus_discovery_maps enable row level security;
alter table public.emmaus_discovery_map_stops enable row level security;
alter table public.emmaus_user_map_progress enable row level security;
alter table public.emmaus_user_map_stop_progress enable row level security;

create policy "Authenticated users can view published Discovery Maps"
on public.emmaus_discovery_maps
for select
to authenticated
using (status = 'published');

create policy "Authenticated users can view stops in published Discovery Maps"
on public.emmaus_discovery_map_stops
for select
to authenticated
using (
  exists (
    select 1
    from public.emmaus_discovery_maps map
    where map.id = emmaus_discovery_map_stops.map_id
      and map.status = 'published'
  )
);

create policy "Users can view their own Discovery Map progress"
on public.emmaus_user_map_progress
for select
using (auth.uid() = user_id);

create policy "Users can create their own Discovery Map progress"
on public.emmaus_user_map_progress
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own Discovery Map progress"
on public.emmaus_user_map_progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can view their own Discovery Map stop progress"
on public.emmaus_user_map_stop_progress
for select
using (auth.uid() = user_id);

create policy "Users can create their own Discovery Map stop progress"
on public.emmaus_user_map_stop_progress
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own Discovery Map stop progress"
on public.emmaus_user_map_stop_progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists emmaus_discovery_maps_status_idx
on public.emmaus_discovery_maps (status, difficulty);

create index if not exists emmaus_discovery_map_stops_map_position_idx
on public.emmaus_discovery_map_stops (map_id, position);

create index if not exists emmaus_user_map_progress_user_idx
on public.emmaus_user_map_progress (user_id, updated_at desc);

create index if not exists emmaus_user_map_stop_progress_user_status_idx
on public.emmaus_user_map_stop_progress (user_id, status);

create or replace function public.start_emmaus_discovery_map(p_map_key text)
returns table (
  map_id uuid,
  map_key text,
  current_stop_key text,
  started boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_map_id uuid;
  v_first_stop text;
  v_inserted integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_map_id
  from public.emmaus_discovery_maps
  where map_key = p_map_key and status = 'published';

  if v_map_id is null then
    raise exception 'Published Discovery Map not found';
  end if;

  select stop_key into v_first_stop
  from public.emmaus_discovery_map_stops
  where map_id = v_map_id
  order by position
  limit 1;

  insert into public.emmaus_user_map_progress (user_id, map_id, current_stop_key)
  values (v_user_id, v_map_id, v_first_stop)
  on conflict (user_id, map_id) do nothing;

  get diagnostics v_inserted = row_count;

  insert into public.emmaus_user_map_stop_progress (user_id, map_stop_id, status)
  select
    v_user_id,
    stop.id,
    case when stop.stop_key = v_first_stop then 'available' else 'locked' end
  from public.emmaus_discovery_map_stops stop
  where stop.map_id = v_map_id
  on conflict (user_id, map_stop_id) do nothing;

  return query select v_map_id, p_map_key, v_first_stop, v_inserted > 0;
end;
$$;

create or replace function public.get_emmaus_map_next_stop(p_map_key text)
returns table (
  map_key text,
  stop_key text,
  discovery_id text,
  pack_id text,
  title text,
  passage text,
  subtitle text,
  position integer,
  stop_type text,
  transition_prompt text,
  reflection_prompt text,
  availability text
)
language sql
stable
security invoker
set search_path = public
as $$
  with selected_map as (
    select id, map_key
    from public.emmaus_discovery_maps
    where map_key = p_map_key and status = 'published'
  ),
  stops as (
    select
      map.map_key,
      stop.id as map_stop_id,
      stop.stop_key,
      stop.discovery_id,
      stop.position,
      stop.stop_type,
      stop.prerequisite_stop_keys,
      stop.transition_prompt,
      stop.reflection_prompt,
      catalog.pack_id,
      catalog.title,
      catalog.passage,
      catalog.subtitle,
      coalesce(progress.status, 'locked') as progress_status
    from selected_map map
    join public.emmaus_discovery_map_stops stop on stop.map_id = map.id
    join public.emmaus_discovery_catalog catalog on catalog.discovery_id = stop.discovery_id
    left join public.emmaus_user_map_stop_progress progress
      on progress.map_stop_id = stop.id
      and progress.user_id = auth.uid()
  ),
  eligible as (
    select
      stop.*,
      case
        when stop.progress_status in ('available', 'in_progress') then stop.progress_status
        when stop.progress_status = 'completed' then 'completed'
        when not exists (
          select 1
          from unnest(stop.prerequisite_stop_keys) required_key
          where not exists (
            select 1
            from stops prerequisite
            where prerequisite.stop_key = required_key
              and prerequisite.progress_status = 'completed'
          )
        ) then 'available'
        else 'locked'
      end as availability
    from stops stop
  )
  select
    eligible.map_key,
    eligible.stop_key,
    eligible.discovery_id,
    eligible.pack_id,
    eligible.title,
    eligible.passage,
    eligible.subtitle,
    eligible.position,
    eligible.stop_type,
    eligible.transition_prompt,
    eligible.reflection_prompt,
    eligible.availability
  from eligible
  where eligible.availability in ('available', 'in_progress')
  order by
    case when eligible.availability = 'in_progress' then 0 else 1 end,
    eligible.position
  limit 1;
$$;

create or replace function public.complete_emmaus_map_stop(
  p_map_key text,
  p_stop_key text,
  p_reflection_response text default null
)
returns table (
  map_completed boolean,
  next_stop_key text,
  awarded_xp integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_map_id uuid;
  v_map_stop_id uuid;
  v_next_stop text;
  v_required_remaining integer;
  v_completion_xp integer;
  v_awarded_xp integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select map.id, map.completion_xp
  into v_map_id, v_completion_xp
  from public.emmaus_discovery_maps map
  where map.map_key = p_map_key and map.status = 'published';

  select stop.id into v_map_stop_id
  from public.emmaus_discovery_map_stops stop
  where stop.map_id = v_map_id and stop.stop_key = p_stop_key;

  if v_map_id is null or v_map_stop_id is null then
    raise exception 'Discovery Map stop not found';
  end if;

  insert into public.emmaus_user_map_stop_progress (
    user_id, map_stop_id, status, started_at, completed_at, reflection_response
  )
  values (
    v_user_id, v_map_stop_id, 'completed', now(), now(), nullif(trim(p_reflection_response), '')
  )
  on conflict (user_id, map_stop_id) do update set
    status = 'completed',
    completed_at = coalesce(emmaus_user_map_stop_progress.completed_at, now()),
    reflection_response = coalesce(excluded.reflection_response, emmaus_user_map_stop_progress.reflection_response);

  select count(*)::integer into v_required_remaining
  from public.emmaus_discovery_map_stops stop
  where stop.map_id = v_map_id
    and stop.stop_type in ('required', 'challenge')
    and not exists (
      select 1
      from public.emmaus_user_map_stop_progress progress
      where progress.user_id = v_user_id
        and progress.map_stop_id = stop.id
        and progress.status = 'completed'
    );

  if v_required_remaining = 0 then
    update public.emmaus_user_map_progress
    set is_completed = true,
        completed_at = coalesce(completed_at, now()),
        updated_at = now(),
        current_stop_key = null
    where user_id = v_user_id and map_id = v_map_id;

    if v_completion_xp > 0 then
      insert into public.emmaus_xp_ledger (user_id, event_type, source_key, points, metadata)
      values (
        v_user_id,
        'discovery_map_completed',
        p_map_key,
        v_completion_xp,
        jsonb_build_object('map_key', p_map_key)
      )
      on conflict (user_id, event_type, source_key) do nothing;

      if found then
        v_awarded_xp := v_completion_xp;
      end if;
    end if;

    return query select true, null::text, v_awarded_xp;
    return;
  end if;

  select next_stop.stop_key into v_next_stop
  from public.get_emmaus_map_next_stop(p_map_key) next_stop
  limit 1;

  update public.emmaus_user_map_progress
  set current_stop_key = v_next_stop,
      updated_at = now()
  where user_id = v_user_id and map_id = v_map_id;

  if v_next_stop is not null then
    update public.emmaus_user_map_stop_progress progress
    set status = 'available'
    from public.emmaus_discovery_map_stops stop
    where progress.user_id = v_user_id
      and progress.map_stop_id = stop.id
      and stop.map_id = v_map_id
      and stop.stop_key = v_next_stop
      and progress.status = 'locked';
  end if;

  return query select false, v_next_stop, 0;
end;
$$;

create or replace function public.set_emmaus_map_updated_at()
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

drop trigger if exists set_emmaus_discovery_maps_updated_at on public.emmaus_discovery_maps;
create trigger set_emmaus_discovery_maps_updated_at
before update on public.emmaus_discovery_maps
for each row execute function public.set_emmaus_map_updated_at();

drop trigger if exists set_emmaus_user_map_progress_updated_at on public.emmaus_user_map_progress;
create trigger set_emmaus_user_map_progress_updated_at
before update on public.emmaus_user_map_progress
for each row execute function public.set_emmaus_map_updated_at();

revoke all on function public.start_emmaus_discovery_map(text) from public;
revoke all on function public.complete_emmaus_map_stop(text, text, text) from public;
grant execute on function public.start_emmaus_discovery_map(text) to authenticated;
grant execute on function public.get_emmaus_map_next_stop(text) to authenticated;
grant execute on function public.complete_emmaus_map_stop(text, text, text) to authenticated;
