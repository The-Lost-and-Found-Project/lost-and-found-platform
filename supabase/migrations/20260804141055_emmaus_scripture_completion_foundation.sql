create extension if not exists http with schema extensions;

update public.emmaus_bible_translations
set provider = 'Free Use Bible API',
    metadata = metadata || jsonb_build_object(
      'provider_translation_id', 'eng_kjv',
      'provider_url', 'https://bible.helloao.org',
      'license_url', 'https://ebible.org/Scriptures/details.php?id=eng-kjv2006',
      'source_sha256', 'a847712eeaae26124d3f9db80a1a9274742981261961b49715f43809774eb43c',
      'expected_books', 66,
      'expected_chapters', 1189,
      'expected_verses', 31102,
      'enrichment_blocked_until_canon_verified', true
    ),
    updated_at = now()
where code = 'KJV';

update public.emmaus_bible_books as book
set metadata = book.metadata || jsonb_build_object('provider_book_id', source.provider_book_id)
from (values
  ('genesis','GEN'),('exodus','EXO'),('leviticus','LEV'),('numbers','NUM'),('deuteronomy','DEU'),
  ('joshua','JOS'),('judges','JDG'),('ruth','RUT'),('1-samuel','1SA'),('2-samuel','2SA'),
  ('1-kings','1KI'),('2-kings','2KI'),('1-chronicles','1CH'),('2-chronicles','2CH'),
  ('ezra','EZR'),('nehemiah','NEH'),('esther','EST'),('job','JOB'),('psalms','PSA'),
  ('proverbs','PRO'),('ecclesiastes','ECC'),('song-of-solomon','SNG'),('isaiah','ISA'),
  ('jeremiah','JER'),('lamentations','LAM'),('ezekiel','EZK'),('daniel','DAN'),('hosea','HOS'),
  ('joel','JOL'),('amos','AMO'),('obadiah','OBA'),('jonah','JON'),('micah','MIC'),('nahum','NAM'),
  ('habakkuk','HAB'),('zephaniah','ZEP'),('haggai','HAG'),('zechariah','ZEC'),('malachi','MAL'),
  ('matthew','MAT'),('mark','MRK'),('luke','LUK'),('john','JHN'),('acts','ACT'),('romans','ROM'),
  ('1-corinthians','1CO'),('2-corinthians','2CO'),('galatians','GAL'),('ephesians','EPH'),
  ('philippians','PHP'),('colossians','COL'),('1-thessalonians','1TH'),('2-thessalonians','2TH'),
  ('1-timothy','1TI'),('2-timothy','2TI'),('titus','TIT'),('philemon','PHM'),('hebrews','HEB'),
  ('james','JAS'),('1-peter','1PE'),('2-peter','2PE'),('1-john','1JN'),('2-john','2JN'),
  ('3-john','3JN'),('jude','JUD'),('revelation','REV')
) as source(book_key, provider_book_id)
where book.book_key = source.book_key;

create table if not exists public.emmaus_scripture_chapter_manifest (
  translation text not null references public.emmaus_bible_translations(code) on delete cascade,
  book_key text not null references public.emmaus_bible_books(book_key) on delete cascade,
  chapter integer not null check (chapter > 0),
  expected_verse_count integer not null check (expected_verse_count > 0),
  imported_verse_count integer not null default 0 check (imported_verse_count >= 0),
  source_url text not null,
  source_checksum text,
  status text not null default 'pending' check (status in ('pending','importing','verified','failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  last_attempt_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (translation, book_key, chapter)
);

create index if not exists emmaus_scripture_manifest_status_idx
  on public.emmaus_scripture_chapter_manifest (translation, status, book_key, chapter);

alter table public.emmaus_scripture_chapter_manifest enable row level security;

create policy "Admins manage Scripture chapter manifest"
on public.emmaus_scripture_chapter_manifest for all
to authenticated
using ((select public.is_emmaus_admin()))
with check ((select public.is_emmaus_admin()));

grant select, insert, update, delete on public.emmaus_scripture_chapter_manifest to authenticated;

create or replace function public.flatten_emmaus_bible_content(p_content jsonb)
returns text
language plpgsql
immutable
security invoker
set search_path = public
as $$
declare
  item jsonb;
  result text := '';
begin
  if jsonb_typeof(p_content) <> 'array' then
    return '';
  end if;

  for item in select value from jsonb_array_elements(p_content)
  loop
    if jsonb_typeof(item) = 'string' then
      result := result || ' ' || (item #>> '{}');
    elsif jsonb_typeof(item) = 'object' then
      result := result || ' ' || coalesce(item->>'text', item->>'heading', '');
      if coalesce((item->>'lineBreak')::boolean, false) then
        result := result || ' ';
      end if;
    end if;
  end loop;

  return trim(regexp_replace(result, '\s+', ' ', 'g'));
end;
$$;

create or replace function public.verify_emmaus_scripture_chapter(
  p_translation text,
  p_book_key text,
  p_chapter integer,
  p_expected_count integer
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with verse_stats as (
    select
      count(*)::integer as verse_count,
      count(distinct verse_start)::integer as distinct_verse_count,
      min(verse_start)::integer as first_verse,
      max(verse_start)::integer as last_verse,
      count(*) filter (where trim(text_content) = '')::integer as empty_verses,
      count(*) filter (where graph_node_id is null)::integer as unlinked_verses
    from public.emmaus_scripture_nodes
    where translation = p_translation
      and book_key = p_book_key
      and chapter = p_chapter
      and status = 'published'
  ), missing as (
    select coalesce(jsonb_agg(n order by n), '[]'::jsonb) as verse_numbers
    from generate_series(1, greatest(p_expected_count, 0)) n
    where not exists (
      select 1
      from public.emmaus_scripture_nodes s
      where s.translation = p_translation
        and s.book_key = p_book_key
        and s.chapter = p_chapter
        and s.verse_start = n
        and s.status = 'published'
    )
  )
  select jsonb_build_object(
    'translation', p_translation,
    'book_key', p_book_key,
    'chapter', p_chapter,
    'expected_verses', p_expected_count,
    'verse_count', v.verse_count,
    'distinct_verse_count', v.distinct_verse_count,
    'first_verse', v.first_verse,
    'last_verse', v.last_verse,
    'empty_verses', v.empty_verses,
    'unlinked_verses', v.unlinked_verses,
    'missing_verses', m.verse_numbers,
    'verified',
      v.verse_count = p_expected_count
      and v.distinct_verse_count = p_expected_count
      and v.first_verse = 1
      and v.last_verse = p_expected_count
      and v.empty_verses = 0
      and v.unlinked_verses = 0
      and m.verse_numbers = '[]'::jsonb
  )
  from verse_stats v cross join missing m;
$$;

create or replace function public.sync_emmaus_scripture_sequence(p_translation text default 'KJV')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if not public.is_emmaus_admin() then
    raise exception 'Not authorized';
  end if;

  delete from public.emmaus_graph_edges edge
  where edge.relationship_key = 'recommended_next'
    and coalesce((edge.metadata->>'sequence')::boolean, false)
    and edge.metadata->>'translation' = p_translation;

  with ordered_verses as (
    select
      graph_node_id as source_node_id,
      lead(graph_node_id) over (order by canonical_order, chapter, verse_start) as target_node_id
    from public.emmaus_scripture_nodes
    where translation = p_translation
      and status = 'published'
      and graph_node_id is not null
  )
  insert into public.emmaus_graph_edges (
    source_node_id, target_node_id, relationship_key, explanation, status, metadata
  )
  select
    source_node_id,
    target_node_id,
    'recommended_next',
    'Continue reading to the next verse.',
    'published',
    jsonb_build_object('sequence', true, 'translation', p_translation)
  from ordered_verses
  where target_node_id is not null
  on conflict (source_node_id, target_node_id, relationship_key) do update set
    explanation = excluded.explanation,
    status = excluded.status,
    metadata = public.emmaus_graph_edges.metadata || excluded.metadata,
    updated_at = now();

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.verify_emmaus_scripture_canon(p_translation text default 'KJV')
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with manifest as (
    select
      count(*)::integer as manifest_chapters,
      count(*) filter (where status = 'verified')::integer as verified_chapters,
      count(*) filter (where status = 'failed')::integer as failed_chapters,
      coalesce(sum(expected_verse_count) filter (where status = 'verified'), 0)::integer as expected_verified_verses
    from public.emmaus_scripture_chapter_manifest
    where translation = p_translation
  ), scripture as (
    select
      count(*)::integer as verses,
      count(distinct (book_key, chapter))::integer as chapters,
      count(distinct book_key)::integer as books,
      count(*) filter (where trim(text_content) = '')::integer as empty_verses,
      count(*) filter (where graph_node_id is null)::integer as unlinked_verses
    from public.emmaus_scripture_nodes
    where translation = p_translation and status = 'published'
  ), graph as (
    select
      count(*) filter (where node_key like 'bible-book:%')::integer as book_nodes,
      count(*) filter (where node_key like 'bible-chapter:%')::integer as chapter_nodes,
      count(*) filter (where node_key like 'scripture:' || lower(p_translation) || ':%')::integer as verse_nodes
    from public.emmaus_graph_nodes
    where status = 'published'
  ), edges as (
    select
      count(*) filter (
        where relationship_key = 'part_of'
          and metadata->>'translation' = p_translation
          and coalesce((metadata->>'structural')::boolean, false)
      )::integer as verse_chapter_edges,
      count(*) filter (
        where relationship_key = 'part_of'
          and metadata->>'translation' is null
          and coalesce((metadata->>'structural')::boolean, false)
      )::integer as chapter_book_edges,
      count(*) filter (
        where relationship_key = 'recommended_next'
          and metadata->>'translation' = p_translation
          and coalesce((metadata->>'sequence')::boolean, false)
      )::integer as sequence_edges
    from public.emmaus_graph_edges
    where status = 'published'
  ), missing_chapters as (
    select coalesce(jsonb_agg(
      jsonb_build_object('book_key', b.book_key, 'chapter', chapter_number)
      order by b.canonical_order, chapter_number
    ), '[]'::jsonb) as chapters
    from public.emmaus_bible_books b
    cross join lateral generate_series(1, b.chapter_count) chapter_number
    where not exists (
      select 1
      from public.emmaus_scripture_chapter_manifest m
      where m.translation = p_translation
        and m.book_key = b.book_key
        and m.chapter = chapter_number
        and m.status = 'verified'
    )
  )
  select jsonb_build_object(
    'translation', p_translation,
    'expected', jsonb_build_object('books', 66, 'chapters', 1189, 'verses', 31102),
    'manifest_chapters', m.manifest_chapters,
    'verified_chapters', m.verified_chapters,
    'failed_chapters', m.failed_chapters,
    'expected_verified_verses', m.expected_verified_verses,
    'books', s.books,
    'chapters', s.chapters,
    'verses', s.verses,
    'empty_verses', s.empty_verses,
    'unlinked_verses', s.unlinked_verses,
    'book_nodes', g.book_nodes,
    'chapter_nodes', g.chapter_nodes,
    'verse_nodes', g.verse_nodes,
    'verse_chapter_edges', e.verse_chapter_edges,
    'chapter_book_edges', e.chapter_book_edges,
    'sequence_edges', e.sequence_edges,
    'missing_chapters', mc.chapters,
    'complete',
      m.verified_chapters = 1189
      and m.failed_chapters = 0
      and m.expected_verified_verses = 31102
      and s.books = 66
      and s.chapters = 1189
      and s.verses = 31102
      and s.empty_verses = 0
      and s.unlinked_verses = 0
      and g.book_nodes = 66
      and g.chapter_nodes = 1189
      and g.verse_nodes = 31102
      and e.verse_chapter_edges = 31102
      and e.chapter_book_edges = 1189
      and e.sequence_edges = 31101
      and mc.chapters = '[]'::jsonb
  )
  from manifest m cross join scripture s cross join graph g cross join edges e cross join missing_chapters mc;
$$;

create or replace function public.finalize_emmaus_scripture_canon(p_translation text default 'KJV')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_emmaus_admin() then
    raise exception 'Not authorized';
  end if;

  select public.verify_emmaus_scripture_canon(p_translation) into result;
  if (result->>'verified_chapters')::integer <> 1189
     or (result->>'verses')::integer <> 31102
     or jsonb_array_length(result->'missing_chapters') <> 0 then
    return result || jsonb_build_object('sequence_sync_deferred', true);
  end if;

  perform public.sync_emmaus_scripture_sequence(p_translation);
  select public.verify_emmaus_scripture_canon(p_translation) into result;

  if coalesce((result->>'complete')::boolean, false) then
    update public.emmaus_bible_translations
    set metadata = metadata || jsonb_build_object(
      'canon_verified', true,
      'canon_verified_at', now(),
      'enrichment_blocked_until_canon_verified', false
    ),
    updated_at = now()
    where code = p_translation;
  end if;

  return result;
end;
$$;

create or replace function public.import_emmaus_scripture_chapter_from_source(
  p_translation text,
  p_book_key text,
  p_chapter integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  bible_book public.emmaus_bible_books;
  provider_translation_id text;
  provider_book_id text;
  source_url text;
  response extensions.http_response;
  payload jsonb;
  expected_count integer;
  source_checksum text;
  verses jsonb;
  chapter_check jsonb;
  import_result jsonb;
begin
  if not public.is_emmaus_admin() then
    raise exception 'Not authorized';
  end if;

  select * into bible_book
  from public.emmaus_bible_books
  where book_key = p_book_key;

  if bible_book.id is null then
    raise exception 'Unknown Bible book: %', p_book_key;
  end if;
  if p_chapter < 1 or p_chapter > bible_book.chapter_count then
    raise exception 'Invalid chapter % for %', p_chapter, bible_book.name;
  end if;

  select metadata->>'provider_translation_id' into provider_translation_id
  from public.emmaus_bible_translations
  where code = p_translation;

  provider_book_id := bible_book.metadata->>'provider_book_id';
  if provider_translation_id is null or provider_book_id is null then
    raise exception 'Provider mapping is incomplete for % %', p_translation, p_book_key;
  end if;

  source_url := format(
    'https://bible.helloao.org/api/%s/%s/%s.json',
    provider_translation_id,
    provider_book_id,
    p_chapter
  );

  select * into response from extensions.http_get(source_url);
  if response.status <> 200 then
    raise exception 'Bible source returned HTTP % for %', response.status, source_url;
  end if;

  payload := response.content::jsonb;
  expected_count := (payload->>'numberOfVerses')::integer;
  source_checksum := encode(extensions.digest(convert_to(response.content, 'UTF8'), 'sha256'), 'hex');

  insert into public.emmaus_scripture_chapter_manifest (
    translation, book_key, chapter, expected_verse_count, source_url,
    source_checksum, status, attempt_count, last_attempt_at, updated_at
  ) values (
    p_translation, p_book_key, p_chapter, expected_count, source_url,
    source_checksum, 'importing', 1, now(), now()
  ) on conflict (translation, book_key, chapter) do update set
    expected_verse_count = excluded.expected_verse_count,
    source_url = excluded.source_url,
    source_checksum = excluded.source_checksum,
    status = 'importing',
    attempt_count = public.emmaus_scripture_chapter_manifest.attempt_count + 1,
    last_error = null,
    last_attempt_at = now(),
    updated_at = now();

  select public.verify_emmaus_scripture_chapter(
    p_translation, p_book_key, p_chapter, expected_count
  ) into chapter_check;

  if coalesce((chapter_check->>'verified')::boolean, false) then
    update public.emmaus_scripture_chapter_manifest
    set status = 'verified',
        imported_verse_count = expected_count,
        verified_at = coalesce(verified_at, now()),
        updated_at = now()
    where translation = p_translation and book_key = p_book_key and chapter = p_chapter;

    return jsonb_build_object(
      'status', 'skipped', 'book_key', p_book_key, 'chapter', p_chapter,
      'verses', expected_count, 'source_checksum', source_checksum
    );
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'verse', (entry->>'number')::integer,
      'text', public.flatten_emmaus_bible_content(entry->'content')
    ) order by (entry->>'number')::integer
  ) into verses
  from jsonb_array_elements(payload->'chapter'->'content') entry
  where entry->>'type' = 'verse';

  if jsonb_array_length(coalesce(verses, '[]'::jsonb)) <> expected_count then
    raise exception 'Source count mismatch for % %: expected %, parsed %',
      p_book_key, p_chapter, expected_count, jsonb_array_length(coalesce(verses, '[]'::jsonb));
  end if;

  select public.import_emmaus_scripture_chapter(
    p_translation,
    p_book_key,
    p_chapter,
    verses,
    'Free Use Bible API ' || p_translation || ' ' || bible_book.name || ' ' || p_chapter,
    true,
    false
  ) into import_result;

  select public.verify_emmaus_scripture_chapter(
    p_translation, p_book_key, p_chapter, expected_count
  ) into chapter_check;

  if not coalesce((chapter_check->>'verified')::boolean, false) then
    raise exception 'Post-import verification failed: %', chapter_check::text;
  end if;

  update public.emmaus_scripture_chapter_manifest
  set status = 'verified',
      imported_verse_count = expected_count,
      last_error = null,
      verified_at = now(),
      updated_at = now()
  where translation = p_translation and book_key = p_book_key and chapter = p_chapter;

  return import_result || jsonb_build_object(
    'status', 'verified',
    'source_checksum', source_checksum,
    'verification', chapter_check
  );
exception when others then
  insert into public.emmaus_scripture_chapter_manifest (
    translation, book_key, chapter, expected_verse_count, source_url,
    status, attempt_count, last_error, last_attempt_at, updated_at
  ) values (
    p_translation,
    p_book_key,
    p_chapter,
    greatest(coalesce(expected_count, 1), 1),
    coalesce(source_url, 'unresolved'),
    'failed',
    1,
    sqlerrm,
    now(),
    now()
  ) on conflict (translation, book_key, chapter) do update set
    status = 'failed',
    attempt_count = case
      when public.emmaus_scripture_chapter_manifest.status = 'importing'
        then public.emmaus_scripture_chapter_manifest.attempt_count
      else public.emmaus_scripture_chapter_manifest.attempt_count + 1
    end,
    last_error = sqlerrm,
    last_attempt_at = now(),
    updated_at = now();

  return jsonb_build_object(
    'status', 'failed', 'book_key', p_book_key, 'chapter', p_chapter, 'error', sqlerrm
  );
end;
$$;

create or replace function public.import_emmaus_scripture_book_from_source(
  p_translation text,
  p_book_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  bible_book public.emmaus_bible_books;
  chapter_number integer;
  chapter_result jsonb;
  imported_count integer := 0;
  skipped_count integer := 0;
  failed_count integer := 0;
  failures jsonb := '[]'::jsonb;
  canon_result jsonb;
begin
  if not public.is_emmaus_admin() then
    raise exception 'Not authorized';
  end if;

  select * into bible_book from public.emmaus_bible_books where book_key = p_book_key;
  if bible_book.id is null then
    raise exception 'Unknown Bible book: %', p_book_key;
  end if;

  for chapter_number in 1..bible_book.chapter_count
  loop
    chapter_result := public.import_emmaus_scripture_chapter_from_source(
      p_translation, p_book_key, chapter_number
    );

    case chapter_result->>'status'
      when 'verified' then imported_count := imported_count + 1;
      when 'skipped' then skipped_count := skipped_count + 1;
      else
        failed_count := failed_count + 1;
        failures := failures || jsonb_build_array(chapter_result);
    end case;
  end loop;

  canon_result := public.finalize_emmaus_scripture_canon(p_translation);

  return jsonb_build_object(
    'translation', p_translation,
    'book_key', p_book_key,
    'chapters', bible_book.chapter_count,
    'imported', imported_count,
    'skipped', skipped_count,
    'failed', failed_count,
    'failures', failures,
    'canon_complete', coalesce((canon_result->>'complete')::boolean, false)
  );
end;
$$;

create or replace function public.search_emmaus_scripture(
  p_query text,
  p_translation text default 'KJV',
  p_limit integer default 50
)
returns table (
  reference_key text,
  reference_label text,
  book_key text,
  chapter integer,
  verse integer,
  text_content text,
  rank real
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.reference_key,
    s.reference_label,
    s.book_key,
    s.chapter,
    s.verse_start,
    s.text_content,
    ts_rank(to_tsvector('english', s.text_content), websearch_to_tsquery('english', p_query))::real as rank
  from public.emmaus_scripture_nodes s
  where s.translation = p_translation
    and s.status = 'published'
    and trim(coalesce(p_query, '')) <> ''
    and (
      to_tsvector('english', s.text_content) @@ websearch_to_tsquery('english', p_query)
      or s.reference_label ilike '%' || p_query || '%'
    )
  order by rank desc, s.canonical_order, s.chapter, s.verse_start
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

revoke all on function public.flatten_emmaus_bible_content(jsonb) from public, anon, authenticated;
revoke all on function public.verify_emmaus_scripture_chapter(text,text,integer,integer) from public, anon;
revoke all on function public.sync_emmaus_scripture_sequence(text) from public, anon;
revoke all on function public.verify_emmaus_scripture_canon(text) from public, anon;
revoke all on function public.finalize_emmaus_scripture_canon(text) from public, anon;
revoke all on function public.import_emmaus_scripture_chapter_from_source(text,text,integer) from public, anon;
revoke all on function public.import_emmaus_scripture_book_from_source(text,text) from public, anon;
revoke all on function public.search_emmaus_scripture(text,text,integer) from public, anon;

grant execute on function public.verify_emmaus_scripture_chapter(text,text,integer,integer) to authenticated;
grant execute on function public.sync_emmaus_scripture_sequence(text) to authenticated;
grant execute on function public.verify_emmaus_scripture_canon(text) to authenticated;
grant execute on function public.finalize_emmaus_scripture_canon(text) to authenticated;
grant execute on function public.import_emmaus_scripture_chapter_from_source(text,text,integer) to authenticated;
grant execute on function public.import_emmaus_scripture_book_from_source(text,text) to authenticated;
grant execute on function public.search_emmaus_scripture(text,text,integer) to authenticated;

do $$
declare
  function_record record;
begin
  for function_record in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.proname like '%emmaus%'
  loop
    execute format('revoke all on function %s from public, anon', function_record.signature);
  end loop;
end;
$$;

do $$
declare
  function_record record;
begin
  for function_record in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'extensions'
      and (p.proname like 'http%' or p.proname = 'urlencode')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', function_record.signature);
  end loop;
end;
$$;
