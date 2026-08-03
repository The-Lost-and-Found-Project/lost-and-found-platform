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
using (auth.uid() = user_id);

create policy "Users can create their own Emmaus progress"
on public.emmaus_discovery_progress
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own Emmaus progress"
on public.emmaus_discovery_progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own Emmaus progress"
on public.emmaus_discovery_progress
for delete
using (auth.uid() = user_id);

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
