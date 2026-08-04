do $$
declare
  scripture_rows bigint;
  edge_rows bigint;
begin
  if to_regclass('public.emmaus_scripture_nodes') is not null
     and not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'emmaus_scripture_nodes'
         and column_name = 'book_key'
     ) then
    execute 'select count(*) from public.emmaus_scripture_nodes' into scripture_rows;
    execute 'select count(*) from public.emmaus_scripture_edges' into edge_rows;

    if scripture_rows > 0 or edge_rows > 0 then
      raise exception
        'Cannot reconcile legacy Emmaus Scripture tables: % nodes and % edges require an explicit data migration',
        scripture_rows,
        edge_rows;
    end if;

    drop table public.emmaus_scripture_edges;
    drop table public.emmaus_scripture_nodes;
  end if;
end;
$$;

create table if not exists public.emmaus_bible_translations (
  code text primary key,
  name text not null,
  language_code text not null default 'en',
  provider text not null default 'local',
  public_domain boolean not null default false,
  is_development_default boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.emmaus_bible_translations (
  code, name, language_code, provider, public_domain, is_development_default, metadata
) values (
  'KJV',
  'King James Version',
  'en',
  'local-development-corpus',
  true,
  true,
  jsonb_build_object(
    'usage', 'Development corpus for Emmaus',
    'future_provider_ready', true
  )
)
on conflict (code) do update set
  name = excluded.name,
  public_domain = excluded.public_domain,
  is_development_default = excluded.is_development_default,
  metadata = public.emmaus_bible_translations.metadata || excluded.metadata,
  updated_at = now();

create table if not exists public.emmaus_bible_books (
  id smallserial primary key,
  book_key text not null unique,
  name text not null unique,
  abbreviation text not null,
  testament text not null check (testament in ('old','new')),
  canonical_order smallint not null unique check (canonical_order between 1 and 66),
  chapter_count smallint not null check (chapter_count > 0),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.emmaus_scripture_nodes (
  id uuid primary key default gen_random_uuid(),
  reference_key text not null,
  book text not null,
  book_key text,
  chapter integer not null check (chapter > 0),
  verse_start integer not null check (verse_start > 0),
  verse_end integer,
  reference_label text not null,
  text_content text not null,
  translation text not null references public.emmaus_bible_translations(code),
  testament text check (testament in ('old','new')),
  canonical_order integer,
  summary text not null default '',
  status text not null default 'draft' check (status in ('draft','reviewed','published','archived')),
  graph_node_id uuid references public.emmaus_graph_nodes(id) on delete set null,
  source_batch_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (translation, reference_key)
);

create index if not exists emmaus_scripture_nodes_reference_idx
  on public.emmaus_scripture_nodes(translation, book_key, chapter, verse_start);
create index if not exists emmaus_scripture_nodes_graph_idx
  on public.emmaus_scripture_nodes(graph_node_id);
create index if not exists emmaus_scripture_nodes_status_idx
  on public.emmaus_scripture_nodes(status, translation);
create index if not exists emmaus_scripture_nodes_text_search_idx
  on public.emmaus_scripture_nodes
  using gin (to_tsvector('english', text_content));

create table if not exists public.emmaus_scripture_import_batches (
  id uuid primary key default gen_random_uuid(),
  translation text not null references public.emmaus_bible_translations(code),
  book_key text not null,
  chapter_start integer,
  chapter_end integer,
  expected_verse_count integer,
  imported_verse_count integer not null default 0,
  source_label text,
  source_checksum text,
  status text not null default 'pending' check (status in ('pending','importing','complete','failed','verified')),
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  verified_at timestamptz
);

alter table public.emmaus_scripture_nodes
  add constraint emmaus_scripture_nodes_source_batch_fkey
  foreign key (source_batch_id)
  references public.emmaus_scripture_import_batches(id)
  on delete set null;

alter table public.emmaus_bible_translations enable row level security;
alter table public.emmaus_bible_books enable row level security;
alter table public.emmaus_scripture_nodes enable row level security;
alter table public.emmaus_scripture_import_batches enable row level security;

create policy "Authenticated users read Bible translations"
on public.emmaus_bible_translations for select
to authenticated using (true);

create policy "Authenticated users read Bible books"
on public.emmaus_bible_books for select
to authenticated using (true);

create policy "Authenticated users read published Scripture"
on public.emmaus_scripture_nodes for select
to authenticated
using (status = 'published' or public.is_emmaus_admin());

create policy "Admins manage Scripture corpus"
on public.emmaus_scripture_nodes for all
to authenticated
using (public.is_emmaus_admin())
with check (public.is_emmaus_admin());

create policy "Admins manage Scripture import batches"
on public.emmaus_scripture_import_batches for all
to authenticated
using (public.is_emmaus_admin())
with check (public.is_emmaus_admin());

create or replace function public.link_emmaus_scripture_to_graph(scripture_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  scripture public.emmaus_scripture_nodes;
  existing_graph_id uuid;
  new_graph_id uuid;
begin
  if not public.is_emmaus_admin() then
    raise exception 'Not authorized';
  end if;

  select * into scripture
  from public.emmaus_scripture_nodes
  where id = scripture_id
  for update;

  if scripture.id is null then
    raise exception 'Scripture record not found';
  end if;

  if scripture.graph_node_id is not null then
    return scripture.graph_node_id;
  end if;

  select id into existing_graph_id
  from public.emmaus_graph_nodes
  where node_key = 'scripture:' || lower(scripture.translation) || ':' || scripture.reference_key
  limit 1;

  if existing_graph_id is not null then
    update public.emmaus_scripture_nodes
    set graph_node_id = existing_graph_id, updated_at = now()
    where id = scripture.id;
    return existing_graph_id;
  end if;

  insert into public.emmaus_graph_nodes (
    node_key,
    node_type,
    title,
    subtitle,
    scripture_reference,
    summary,
    status,
    metadata
  ) values (
    'scripture:' || lower(scripture.translation) || ':' || scripture.reference_key,
    'verse',
    scripture.reference_label,
    scripture.translation,
    scripture.reference_label,
    scripture.text_content,
    scripture.status,
    jsonb_build_object(
      'scripture_id', scripture.id,
      'translation', scripture.translation,
      'book', scripture.book,
      'book_key', scripture.book_key,
      'chapter', scripture.chapter,
      'verse_start', scripture.verse_start,
      'verse_end', scripture.verse_end,
      'canonical_order', scripture.canonical_order
    )
  ) returning id into new_graph_id;

  update public.emmaus_scripture_nodes
  set graph_node_id = new_graph_id, updated_at = now()
  where id = scripture.id;

  return new_graph_id;
end;
$$;

grant execute on function public.link_emmaus_scripture_to_graph(uuid) to authenticated;

create or replace function public.link_emmaus_scripture_batch_to_graph(batch_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  scripture_record record;
  linked_count integer := 0;
begin
  if not public.is_emmaus_admin() then
    raise exception 'Not authorized';
  end if;

  for scripture_record in
    select id
    from public.emmaus_scripture_nodes
    where source_batch_id = batch_id
      and graph_node_id is null
    order by canonical_order, chapter, verse_start
  loop
    perform public.link_emmaus_scripture_to_graph(scripture_record.id);
    linked_count := linked_count + 1;
  end loop;

  return linked_count;
end;
$$;

grant execute on function public.link_emmaus_scripture_batch_to_graph(uuid) to authenticated;

revoke all on function public.link_emmaus_scripture_to_graph(uuid) from public, anon;
revoke all on function public.link_emmaus_scripture_batch_to_graph(uuid) from public, anon;
