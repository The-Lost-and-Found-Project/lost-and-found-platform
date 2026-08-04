create table if not exists public.emmaus_discovery_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id uuid not null references public.emmaus_graph_nodes(id) on delete cascade,
  prompt text,
  response text not null,
  entry_type text not null default 'observation' check (entry_type in ('observation','interpretation','application','prayer','question')),
  source text not null default 'walk_mode',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists emmaus_discovery_journal_user_node_idx
  on public.emmaus_discovery_journal_entries(user_id,node_id,created_at desc);

alter table public.emmaus_discovery_journal_entries enable row level security;

create policy "Users read their discovery journal"
on public.emmaus_discovery_journal_entries for select
to authenticated using (user_id=auth.uid());

create policy "Users create discovery journal entries"
on public.emmaus_discovery_journal_entries for insert
to authenticated with check (user_id=auth.uid());

create policy "Users update discovery journal entries"
on public.emmaus_discovery_journal_entries for update
to authenticated
using (user_id=auth.uid())
with check (user_id=auth.uid());

create policy "Users delete discovery journal entries"
on public.emmaus_discovery_journal_entries for delete
to authenticated using (user_id=auth.uid());
