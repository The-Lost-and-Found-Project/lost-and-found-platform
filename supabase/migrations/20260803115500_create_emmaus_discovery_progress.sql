do $$
declare
  progress_rows bigint;
begin
  if to_regclass('public.emmaus_discovery_progress') is not null
     and not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'emmaus_discovery_progress'
         and column_name = 'pack_id'
     ) then
    execute 'select count(*) from public.emmaus_discovery_progress' into progress_rows;

    if progress_rows > 0 then
      raise exception
        'Cannot reconcile legacy emmaus_discovery_progress: % rows require an explicit data migration',
        progress_rows;
    end if;

    drop table public.emmaus_discovery_progress;
  end if;
end;
$$;

create table if not exists public.emmaus_discovery_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_id text not null,
  discovery_id text not null,
  current_step integer not null default 0 check (current_step >= 0),
  responses jsonb not null default '{}'::jsonb,
  revealed_clues integer not null default 0 check (revealed_clues >= 0),
  is_completed boolean not null default false,
  completed_at timestamptz,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, pack_id, discovery_id)
);

alter table public.emmaus_discovery_progress enable row level security;

create policy "Users can view their own Emmaus progress"
on public.emmaus_discovery_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own Emmaus progress"
on public.emmaus_discovery_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own Emmaus progress"
on public.emmaus_discovery_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own Emmaus progress"
on public.emmaus_discovery_progress
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists emmaus_discovery_progress_user_updated_idx
on public.emmaus_discovery_progress (user_id, updated_at desc);

create or replace function public.set_emmaus_progress_updated_at()
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

drop trigger if exists set_emmaus_progress_updated_at on public.emmaus_discovery_progress;
create trigger set_emmaus_progress_updated_at
before update on public.emmaus_discovery_progress
for each row execute function public.set_emmaus_progress_updated_at();
