alter table public.emmaus_graph_edges
  add column if not exists confidence_score integer not null default 70 check (confidence_score between 0 and 100),
  add column if not exists confidence_class text not null default 'supported' check (confidence_class in ('explicit', 'strong', 'supported', 'tentative', 'disputed')),
  add column if not exists evidence_summary text,
  add column if not exists interpretive_notes text,
  add column if not exists source_count integer not null default 0 check (source_count >= 0);

create table if not exists public.emmaus_edge_evidence (
  id uuid primary key default gen_random_uuid(),
  edge_id uuid not null references public.emmaus_graph_edges(id) on delete cascade,
  evidence_type text not null check (evidence_type in (
    'direct_quote', 'explicit_statement', 'shared_wording', 'shared_theme',
    'literary_structure', 'historical_context', 'canonical_pattern',
    'language_evidence', 'typology', 'scholarly_source', 'traditional_interpretation',
    'counterargument'
  )),
  title text not null,
  description text not null,
  scripture_reference text,
  source_citation text,
  weight integer not null default 1 check (weight between -10 and 10),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.emmaus_edge_evidence enable row level security;

create policy "Authenticated users can view evidence for published Emmaus edges"
on public.emmaus_edge_evidence
for select
to authenticated
using (
  exists (
    select 1
    from public.emmaus_graph_edges edge
    where edge.id = emmaus_edge_evidence.edge_id
      and edge.status = 'published'
  )
);

create index if not exists emmaus_edge_evidence_edge_idx
on public.emmaus_edge_evidence (edge_id, evidence_type);

create or replace function public.classify_emmaus_confidence(p_score integer)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_score, 0) >= 95 then 'explicit'
    when coalesce(p_score, 0) >= 85 then 'strong'
    when coalesce(p_score, 0) >= 65 then 'supported'
    when coalesce(p_score, 0) >= 40 then 'tentative'
    else 'disputed'
  end;
$$;

create or replace function public.recalculate_emmaus_edge_confidence(p_edge_id uuid)
returns table (
  edge_id uuid,
  confidence_score integer,
  confidence_class text,
  evidence_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base integer;
  v_adjustment integer;
  v_count integer;
  v_score integer;
  v_class text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select case relationship_key
    when 'quotes' then 95
    when 'cross_references' then 88
    when 'fulfills' then 82
    when 'alludes_to' then 75
    when 'foreshadows' then 68
    when 'supports_doctrine' then 72
    when 'reveals_attribute' then 78
    when 'uses_term' then 90
    when 'features_person' then 95
    when 'occurs_at' then 92
    when 'part_of' then 98
    when 'recommended_next' then 60
    else 70
  end
  into v_base
  from public.emmaus_graph_edges
  where id = p_edge_id;

  if v_base is null then
    raise exception 'Emmaus graph edge not found';
  end if;

  select coalesce(sum(weight), 0)::integer, count(*)::integer
  into v_adjustment, v_count
  from public.emmaus_edge_evidence
  where edge_id = p_edge_id;

  v_score := greatest(0, least(100, v_base + v_adjustment));
  v_class := public.classify_emmaus_confidence(v_score);

  update public.emmaus_graph_edges
  set confidence_score = v_score,
      confidence_class = v_class,
      source_count = v_count,
      updated_at = now()
  where id = p_edge_id;

  return query select p_edge_id, v_score, v_class, v_count;
end;
$$;

revoke all on function public.recalculate_emmaus_edge_confidence(uuid) from public;
grant execute on function public.classify_emmaus_confidence(integer) to authenticated;
grant execute on function public.recalculate_emmaus_edge_confidence(uuid) to authenticated;

create or replace view public.emmaus_published_connections
with (security_invoker = true)
as
select
  edge.id,
  source.node_key as source_key,
  source.node_type as source_type,
  source.title as source_title,
  target.node_key as target_key,
  target.node_type as target_type,
  target.title as target_title,
  edge.relationship_key,
  rel.label as relationship_label,
  edge.explanation,
  edge.confidence_score,
  edge.confidence_class,
  edge.evidence_summary,
  edge.interpretive_notes,
  edge.source_count,
  edge.weight
from public.emmaus_graph_edges edge
join public.emmaus_graph_nodes source on source.id = edge.source_node_id
join public.emmaus_graph_nodes target on target.id = edge.target_node_id
join public.emmaus_relationship_types rel on rel.key = edge.relationship_key
where edge.status = 'published'
  and source.status = 'published'
  and target.status = 'published';
