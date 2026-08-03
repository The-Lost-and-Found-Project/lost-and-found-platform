create table if not exists public.emmaus_xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  source_key text not null,
  points integer not null check (points > 0),
  metadata jsonb not null default '{}'::jsonb,
  awarded_at timestamptz not null default now(),
  unique (user_id, event_type, source_key)
);

alter table public.emmaus_xp_ledger enable row level security;

create policy "Users can view their own Emmaus XP"
on public.emmaus_xp_ledger
for select
using (auth.uid() = user_id);

create index if not exists emmaus_xp_ledger_user_awarded_idx
on public.emmaus_xp_ledger (user_id, awarded_at desc);

create or replace function public.award_emmaus_xp(
  p_event_type text,
  p_source_key text,
  p_points integer,
  p_metadata jsonb default '{}'::jsonb
)
returns table (awarded boolean, total_xp integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserted integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_points <= 0 then
    raise exception 'Points must be positive';
  end if;

  insert into public.emmaus_xp_ledger (user_id, event_type, source_key, points, metadata)
  values (v_user_id, p_event_type, p_source_key, p_points, coalesce(p_metadata, '{}'::jsonb))
  on conflict (user_id, event_type, source_key) do nothing;

  get diagnostics v_inserted = row_count;

  return query
  select
    v_inserted > 0,
    coalesce(sum(points), 0)::integer
  from public.emmaus_xp_ledger
  where user_id = v_user_id;
end;
$$;

revoke all on function public.award_emmaus_xp(text, text, integer, jsonb) from public;
grant execute on function public.award_emmaus_xp(text, text, integer, jsonb) to authenticated;

create or replace view public.emmaus_xp_totals
with (security_invoker = true)
as
select
  user_id,
  sum(points)::integer as total_xp,
  count(*)::integer as award_count,
  max(awarded_at) as last_awarded_at
from public.emmaus_xp_ledger
group by user_id;
