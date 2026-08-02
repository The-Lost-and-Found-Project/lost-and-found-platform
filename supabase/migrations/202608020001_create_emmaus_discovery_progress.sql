create table if not exists public.emmaus_discovery_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discovery_id uuid not null references public.emmaus_discoveries(id) on delete cascade,
  current_step integer not null default 0 check (current_step between 0 and 7),
  responses jsonb not null default '{}'::jsonb,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, discovery_id)
);

alter table public.emmaus_discovery_progress enable row level security;

create index if not exists emmaus_discovery_progress_user_idx
  on public.emmaus_discovery_progress(user_id);
create index if not exists emmaus_discovery_progress_discovery_idx
  on public.emmaus_discovery_progress(discovery_id);
create index if not exists emmaus_discovery_progress_status_idx
  on public.emmaus_discovery_progress(status);
create index if not exists emmaus_discovery_progress_activity_idx
  on public.emmaus_discovery_progress(last_activity_at desc);

create or replace function public.set_emmaus_discovery_progress_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  new.last_activity_at = now();

  if new.status = 'completed' and old.status <> 'completed' then
    new.completed_at = coalesce(new.completed_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists set_emmaus_discovery_progress_updated_at
  on public.emmaus_discovery_progress;
create trigger set_emmaus_discovery_progress_updated_at
before update on public.emmaus_discovery_progress
for each row execute function public.set_emmaus_discovery_progress_updated_at();

create policy "Users can read own discovery progress"
on public.emmaus_discovery_progress
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own discovery progress"
on public.emmaus_discovery_progress
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own discovery progress"
on public.emmaus_discovery_progress
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
