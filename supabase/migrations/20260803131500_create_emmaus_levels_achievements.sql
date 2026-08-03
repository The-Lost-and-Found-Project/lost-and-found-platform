create table if not exists public.emmaus_achievement_definitions (
  key text primary key,
  title text not null,
  description text not null,
  category text not null,
  icon text not null default '✦',
  xp_bonus integer not null default 0 check (xp_bonus >= 0),
  is_hidden boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.emmaus_user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null references public.emmaus_achievement_definitions(key) on delete cascade,
  unlocked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, achievement_key)
);

alter table public.emmaus_achievement_definitions enable row level security;
alter table public.emmaus_user_achievements enable row level security;

create policy "Authenticated users can view achievement definitions"
on public.emmaus_achievement_definitions
for select
to authenticated
using (true);

create policy "Users can view their own achievements"
on public.emmaus_user_achievements
for select
using (auth.uid() = user_id);

create index if not exists emmaus_user_achievements_user_idx
on public.emmaus_user_achievements (user_id, unlocked_at desc);

insert into public.emmaus_achievement_definitions (key, title, description, category, icon, xp_bonus, is_hidden, sort_order)
values
  ('first-discovery', 'First Discovery', 'Complete your first guided Emmaus discovery.', 'milestone', '🕯', 25, false, 10),
  ('faithful-finisher', 'Faithful Finisher', 'Complete five guided Emmaus discoveries.', 'consistency', '✓', 50, false, 20),
  ('journal-keeper', 'Journal Keeper', 'Record journal responses in three completed discoveries.', 'reflection', '✍', 40, false, 30),
  ('independent-observer', 'Independent Observer', 'Complete a discovery without revealing a clue.', 'study-skill', '👁', 35, false, 40),
  ('scripture-connector', 'Scripture Connector', 'Complete three discoveries focused on biblical connections.', 'study-skill', '🔗', 50, false, 50),
  ('context-builder', 'Context Builder', 'Complete three discoveries focused on context.', 'study-skill', '🏺', 50, false, 60),
  ('berean-path', 'Berean Path', 'Complete ten guided Emmaus discoveries.', 'milestone', '📖', 100, false, 70)
on conflict (key) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  icon = excluded.icon,
  xp_bonus = excluded.xp_bonus,
  is_hidden = excluded.is_hidden,
  sort_order = excluded.sort_order;

create or replace function public.get_emmaus_level(p_total_xp integer)
returns table (
  level_number integer,
  level_name text,
  level_floor integer,
  next_level_xp integer,
  xp_into_level integer,
  xp_needed integer
)
language sql
immutable
as $$
  with levels as (
    select * from (values
      (1, 'Explorer', 0, 150),
      (2, 'Seeker', 150, 400),
      (3, 'Berean', 400, 800),
      (4, 'Disciple', 800, 1400),
      (5, 'Steward', 1400, 2200),
      (6, 'Guide', 2200, null::integer)
    ) as t(level_number, level_name, level_floor, next_level_xp)
  )
  select
    l.level_number,
    l.level_name,
    l.level_floor,
    l.next_level_xp,
    greatest(coalesce(p_total_xp, 0) - l.level_floor, 0),
    case when l.next_level_xp is null then 0 else greatest(l.next_level_xp - coalesce(p_total_xp, 0), 0) end
  from levels l
  where coalesce(p_total_xp, 0) >= l.level_floor
    and (l.next_level_xp is null or coalesce(p_total_xp, 0) < l.next_level_xp)
  limit 1;
$$;

create or replace function public.evaluate_emmaus_achievements()
returns table (
  achievement_key text,
  title text,
  description text,
  icon text,
  xp_bonus integer,
  newly_unlocked boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_completed integer;
  v_journaled integer;
  v_no_clue integer;
  v_connect integer;
  v_context integer;
  v_key text;
  v_inserted integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select count(*)::integer into v_completed
  from public.emmaus_discovery_progress
  where user_id = v_user_id and is_completed = true;

  select count(*)::integer into v_journaled
  from public.emmaus_discovery_progress
  where user_id = v_user_id
    and is_completed = true
    and coalesce(length(trim(responses->>'journal')), 0) > 0;

  select count(*)::integer into v_no_clue
  from public.emmaus_discovery_progress
  where user_id = v_user_id and is_completed = true and revealed_clues = 0;

  select count(*)::integer into v_connect
  from public.emmaus_xp_ledger
  where user_id = v_user_id
    and event_type = 'skill_focus'
    and metadata->>'skill' = 'connect';

  select count(*)::integer into v_context
  from public.emmaus_xp_ledger
  where user_id = v_user_id
    and event_type = 'skill_focus'
    and metadata->>'skill' = 'context';

  for v_key in
    select key from public.emmaus_achievement_definitions
    where
      (key = 'first-discovery' and v_completed >= 1)
      or (key = 'faithful-finisher' and v_completed >= 5)
      or (key = 'journal-keeper' and v_journaled >= 3)
      or (key = 'independent-observer' and v_no_clue >= 1)
      or (key = 'scripture-connector' and v_connect >= 3)
      or (key = 'context-builder' and v_context >= 3)
      or (key = 'berean-path' and v_completed >= 10)
  loop
    insert into public.emmaus_user_achievements (user_id, achievement_key)
    values (v_user_id, v_key)
    on conflict (user_id, achievement_key) do nothing;

    get diagnostics v_inserted = row_count;

    if v_inserted > 0 then
      insert into public.emmaus_xp_ledger (user_id, event_type, source_key, points, metadata)
      select v_user_id, 'achievement_unlocked', v_key, d.xp_bonus, jsonb_build_object('achievement_key', v_key)
      from public.emmaus_achievement_definitions d
      where d.key = v_key and d.xp_bonus > 0
      on conflict (user_id, event_type, source_key) do nothing;
    end if;

    return query
    select d.key, d.title, d.description, d.icon, d.xp_bonus, v_inserted > 0
    from public.emmaus_achievement_definitions d
    where d.key = v_key;
  end loop;
end;
$$;

revoke all on function public.evaluate_emmaus_achievements() from public;
grant execute on function public.evaluate_emmaus_achievements() to authenticated;
grant execute on function public.get_emmaus_level(integer) to authenticated;
