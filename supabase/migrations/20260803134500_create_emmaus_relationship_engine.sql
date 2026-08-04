create table if not exists public.emmaus_graph_nodes (
  id uuid primary key default gen_random_uuid(),
  node_key text not null unique,
  node_type text not null check (node_type in (
    'verse', 'passage', 'book', 'person', 'place', 'event', 'theme',
    'doctrine', 'attribute', 'language_term', 'command', 'promise',
    'question', 'discipline', 'life_topic', 'discovery', 'rabbit_trail'
  )),
  title text not null,
  subtitle text,
  summary text,
  scripture_reference text,
  language_code text,
  transliteration text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emmaus_relationship_types (
  key text primary key,
  label text not null,
  inverse_label text,
  description text not null,
  category text not null,
  is_directional boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.emmaus_graph_edges (
  id uuid primary key default gen_random_uuid(),
  source_node_id uuid not null references public.emmaus_graph_nodes(id) on delete cascade,
  target_node_id uuid not null references public.emmaus_graph_nodes(id) on delete cascade,
  relationship_key text not null references public.emmaus_relationship_types(key) on delete restrict,
  weight numeric(5,2) not null default 1.00 check (weight > 0),
  explanation text,
  evidence jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_node_id <> target_node_id),
  unique (source_node_id, target_node_id, relationship_key)
);

alter table public.emmaus_graph_nodes enable row level security;
alter table public.emmaus_relationship_types enable row level security;
alter table public.emmaus_graph_edges enable row level security;

create policy "Authenticated users can view published Emmaus graph nodes"
on public.emmaus_graph_nodes
for select
to authenticated
using (status = 'published');

create policy "Authenticated users can view Emmaus relationship types"
on public.emmaus_relationship_types
for select
to authenticated
using (true);

create policy "Authenticated users can view published Emmaus graph edges"
on public.emmaus_graph_edges
for select
to authenticated
using (status = 'published');

create index if not exists emmaus_graph_nodes_type_status_idx
on public.emmaus_graph_nodes (node_type, status);

create index if not exists emmaus_graph_nodes_reference_idx
on public.emmaus_graph_nodes (scripture_reference)
where scripture_reference is not null;

create index if not exists emmaus_graph_edges_source_idx
on public.emmaus_graph_edges (source_node_id, status);

create index if not exists emmaus_graph_edges_target_idx
on public.emmaus_graph_edges (target_node_id, status);

create index if not exists emmaus_graph_edges_relationship_idx
on public.emmaus_graph_edges (relationship_key, status);

insert into public.emmaus_relationship_types (key, label, inverse_label, description, category, is_directional, sort_order)
values
  ('cross_references', 'Cross-references', 'Cross-references', 'Passages directly illuminate or echo one another.', 'scripture', false, 10),
  ('quotes', 'Quotes', 'Is quoted by', 'One passage directly quotes another.', 'scripture', true, 20),
  ('alludes_to', 'Alludes to', 'Is echoed by', 'A passage intentionally echoes language, imagery, or structure from another.', 'scripture', true, 30),
  ('fulfills', 'Fulfills', 'Is fulfilled by', 'A person, event, or passage fulfills a prior promise, pattern, or prophecy.', 'redemption', true, 40),
  ('foreshadows', 'Foreshadows', 'Is foreshadowed by', 'An earlier person, event, institution, or pattern anticipates a later one.', 'redemption', true, 50),
  ('reveals_attribute', 'Reveals attribute', 'Is revealed in', 'A passage or event reveals an attribute of God.', 'theology', true, 60),
  ('supports_doctrine', 'Supports doctrine', 'Is supported by', 'A passage contributes evidence to a doctrinal conclusion.', 'theology', true, 70),
  ('features_person', 'Features person', 'Appears in', 'A passage, event, or discovery includes a biblical person.', 'entity', true, 80),
  ('features_event', 'Features event', 'Appears in', 'A passage or discovery includes a biblical event.', 'entity', true, 85),
  ('occurs_at', 'Occurs at', 'Is location of', 'An event or passage is associated with a place.', 'entity', true, 90),
  ('develops_theme', 'Develops theme', 'Is developed in', 'A passage or discovery develops a biblical theme.', 'theme', true, 100),
  ('uses_term', 'Uses language term', 'Appears in', 'A passage or discovery uses a significant Hebrew, Aramaic, or Greek term.', 'language', true, 110),
  ('applies_to', 'Applies to', 'Is addressed by', 'A passage or discovery speaks meaningfully to a life topic or spiritual discipline.', 'application', true, 120),
  ('part_of', 'Is part of', 'Contains', 'A node belongs to a larger passage, book, discovery, trail, or journey.', 'structure', true, 130),
  ('recommended_next', 'Recommended next', 'Recommended after', 'A discovery naturally prepares the learner for another discovery.', 'journey', true, 140)
on conflict (key) do update set
  label = excluded.label,
  inverse_label = excluded.inverse_label,
  description = excluded.description,
  category = excluded.category,
  is_directional = excluded.is_directional,
  sort_order = excluded.sort_order;

create or replace function public.set_emmaus_graph_updated_at()
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

drop trigger if exists set_emmaus_graph_nodes_updated_at on public.emmaus_graph_nodes;
create trigger set_emmaus_graph_nodes_updated_at
before update on public.emmaus_graph_nodes
for each row execute function public.set_emmaus_graph_updated_at();

drop trigger if exists set_emmaus_graph_edges_updated_at on public.emmaus_graph_edges;
create trigger set_emmaus_graph_edges_updated_at
before update on public.emmaus_graph_edges
for each row execute function public.set_emmaus_graph_updated_at();

create or replace function public.get_emmaus_node_neighborhood(
  p_node_key text,
  p_depth integer default 1,
  p_limit integer default 60
)
returns table (
  node_key text,
  node_type text,
  title text,
  subtitle text,
  scripture_reference text,
  depth integer,
  via_relationship text,
  parent_node_key text
)
language sql
stable
security invoker
set search_path = public
as $$
  with recursive walk as (
    select
      n.id,
      n.node_key,
      n.node_type,
      n.title,
      n.subtitle,
      n.scripture_reference,
      0 as depth,
      null::text as via_relationship,
      null::text as parent_node_key,
      array[n.id]::uuid[] as visited
    from public.emmaus_graph_nodes n
    where n.node_key = p_node_key and n.status = 'published'

    union all

    select
      neighbor.id,
      neighbor.node_key,
      neighbor.node_type,
      neighbor.title,
      neighbor.subtitle,
      neighbor.scripture_reference,
      w.depth + 1,
      e.relationship_key,
      w.node_key,
      w.visited || neighbor.id
    from walk w
    join public.emmaus_graph_edges e
      on e.status = 'published'
      and (e.source_node_id = w.id or e.target_node_id = w.id)
    join public.emmaus_graph_nodes neighbor
      on neighbor.id = case when e.source_node_id = w.id then e.target_node_id else e.source_node_id end
      and neighbor.status = 'published'
    where w.depth < greatest(1, least(coalesce(p_depth, 1), 3))
      and not neighbor.id = any(w.visited)
  )
  select
    walk.node_key,
    walk.node_type,
    walk.title,
    walk.subtitle,
    walk.scripture_reference,
    walk.depth,
    walk.via_relationship,
    walk.parent_node_key
  from walk
  order by walk.depth, walk.title
  limit greatest(1, least(coalesce(p_limit, 60), 200));
$$;

grant execute on function public.get_emmaus_node_neighborhood(text, integer, integer) to authenticated;
