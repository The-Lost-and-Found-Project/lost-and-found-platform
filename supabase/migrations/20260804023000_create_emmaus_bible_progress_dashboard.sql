create or replace function public.get_emmaus_bible_progress(p_translation text default 'KJV')
returns table(
  book_key text,
  book_name text,
  testament text,
  canonical_order integer,
  chapter_count integer,
  imported_chapters integer,
  imported_verses integer,
  enriched_verses integer,
  graph_edges integer,
  pending_enrichment integer,
  chapter_percent integer,
  enrichment_percent integer
)
language sql
stable
security definer
set search_path=public
as $$
  with verse_stats as (
    select
      s.book_key,
      count(*)::integer as imported_verses,
      count(distinct s.chapter)::integer as imported_chapters,
      count(*) filter (
        where exists (
          select 1
          from public.emmaus_graph_edges e
          where e.source_node_id=s.graph_node_id
            and e.status='published'
            and coalesce((e.metadata->>'structural')::boolean,false)=false
        )
      )::integer as enriched_verses,
      count(e.id)::integer as graph_edges
    from public.emmaus_scripture_nodes s
    left join public.emmaus_graph_edges e on e.source_node_id=s.graph_node_id and e.status='published'
    where s.translation=p_translation and s.status<>'archived'
    group by s.book_key
  ), backlog as (
    select s.book_key,count(*)::integer as pending_enrichment
    from public.emmaus_scripture_enrichment_queue q
    join public.emmaus_scripture_nodes s on s.id=q.scripture_node_id
    where s.translation=p_translation and q.status in ('pending','in_progress')
    group by s.book_key
  )
  select
    b.book_key,
    b.name,
    b.testament,
    b.canonical_order::integer,
    b.chapter_count::integer,
    coalesce(v.imported_chapters,0),
    coalesce(v.imported_verses,0),
    coalesce(v.enriched_verses,0),
    coalesce(v.graph_edges,0),
    coalesce(q.pending_enrichment,0),
    case when b.chapter_count=0 then 0 else floor(coalesce(v.imported_chapters,0)::numeric/b.chapter_count*100)::integer end,
    case when coalesce(v.imported_verses,0)=0 then 0 else floor(coalesce(v.enriched_verses,0)::numeric/v.imported_verses*100)::integer end
  from public.emmaus_bible_books b
  left join verse_stats v on v.book_key=b.book_key
  left join backlog q on q.book_key=b.book_key
  where public.is_emmaus_admin()
  order by b.canonical_order;
$$;

grant execute on function public.get_emmaus_bible_progress(text) to authenticated;
