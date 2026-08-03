create table if not exists public.emmaus_connection_suggestions (
  id uuid primary key default gen_random_uuid(),
  source_node_id uuid not null references public.emmaus_graph_nodes(id) on delete cascade,
  target_node_id uuid not null references public.emmaus_graph_nodes(id) on delete cascade,
  relationship_key text not null references public.emmaus_relationship_types(key),
  score integer not null check (score between 0 and 100),
  confidence_class text not null default 'tentative',
  rationale text not null,
  evidence jsonb not null default '[]'::jsonb,
  generator text not null default 'deterministic-v1',
  status text not null default 'pending' check (status in ('pending','approved','rejected','dismissed')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_node_id, target_node_id, relationship_key)
);

create index if not exists emmaus_connection_suggestions_status_idx
  on public.emmaus_connection_suggestions(status, score desc);

create index if not exists emmaus_connection_suggestions_source_idx
  on public.emmaus_connection_suggestions(source_node_id);

create index if not exists emmaus_connection_suggestions_target_idx
  on public.emmaus_connection_suggestions(target_node_id);

alter table public.emmaus_connection_suggestions enable row level security;

create policy "Admins can view Emmaus connection suggestions"
on public.emmaus_connection_suggestions
for select
to authenticated
using (public.is_emmaus_admin());

create policy "Admins can create Emmaus connection suggestions"
on public.emmaus_connection_suggestions
for insert
to authenticated
with check (public.is_emmaus_admin());

create policy "Admins can update Emmaus connection suggestions"
on public.emmaus_connection_suggestions
for update
to authenticated
using (public.is_emmaus_admin())
with check (public.is_emmaus_admin());

create policy "Admins can delete Emmaus connection suggestions"
on public.emmaus_connection_suggestions
for delete
to authenticated
using (public.is_emmaus_admin());

create or replace function public.approve_emmaus_connection_suggestion(suggestion_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  suggestion public.emmaus_connection_suggestions;
  edge_id uuid;
begin
  if not public.is_emmaus_admin() then
    raise exception 'Not authorized';
  end if;

  select * into suggestion
  from public.emmaus_connection_suggestions
  where id = suggestion_id
  for update;

  if suggestion.id is null then
    raise exception 'Suggestion not found';
  end if;

  insert into public.emmaus_graph_edges (
    source_node_id,
    target_node_id,
    relationship_key,
    explanation,
    confidence_score,
    confidence_class,
    evidence_summary,
    interpretive_notes,
    status
  ) values (
    suggestion.source_node_id,
    suggestion.target_node_id,
    suggestion.relationship_key,
    suggestion.rationale,
    suggestion.score,
    suggestion.confidence_class,
    suggestion.evidence::text,
    'Approved from deterministic connection suggestion ' || suggestion.id::text,
    'draft'
  )
  returning id into edge_id;

  update public.emmaus_connection_suggestions
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = suggestion_id;

  return edge_id;
end;
$$;

grant execute on function public.approve_emmaus_connection_suggestion(uuid) to authenticated;
