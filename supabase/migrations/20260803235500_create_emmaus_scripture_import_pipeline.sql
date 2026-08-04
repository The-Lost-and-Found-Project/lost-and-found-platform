create table if not exists public.emmaus_scripture_enrichment_queue (
  id uuid primary key default gen_random_uuid(),
  scripture_node_id uuid not null references public.emmaus_scripture_nodes(id) on delete cascade,
  enrichment_type text not null check (enrichment_type in ('people','places','events','themes','questions','language','cross_references','historical_context')),
  priority integer not null default 50 check (priority between 0 and 100),
  status text not null default 'pending' check (status in ('pending','in_progress','complete','dismissed')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scripture_node_id,enrichment_type)
);

create index if not exists emmaus_scripture_enrichment_queue_status_idx
  on public.emmaus_scripture_enrichment_queue(status,priority desc,created_at);

alter table public.emmaus_scripture_enrichment_queue enable row level security;

create policy "Admins manage Scripture enrichment queue"
on public.emmaus_scripture_enrichment_queue for all
to authenticated
using (public.is_emmaus_admin())
with check (public.is_emmaus_admin());

create or replace function public.import_emmaus_scripture_chapter(
  p_translation text,
  p_book_key text,
  p_chapter integer,
  p_verses jsonb,
  p_source_label text default null,
  p_publish boolean default true,
  p_queue_enrichment boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  bible_book public.emmaus_bible_books;
  batch_id uuid;
  chapter_node_id uuid;
  verse_item jsonb;
  verse_number integer;
  verse_text text;
  v_reference_key text;
  v_reference_label text;
  scripture_id uuid;
  graph_node_id uuid;
  previous_graph_node_id uuid:=null;
  imported_count integer:=0;
  updated_count integer:=0;
  queued_count integer:=0;
  record_status text;
begin
  if not public.is_emmaus_admin() then raise exception 'Not authorized'; end if;
  if jsonb_typeof(p_verses)<>'array' then raise exception 'p_verses must be a JSON array'; end if;
  if jsonb_array_length(p_verses)=0 then raise exception 'p_verses cannot be empty'; end if;

  select * into bible_book from public.emmaus_bible_books where book_key=p_book_key;
  if bible_book.id is null then raise exception 'Unknown Bible book: %',p_book_key; end if;
  if p_chapter<1 or p_chapter>bible_book.chapter_count then raise exception 'Invalid chapter % for %',p_chapter,bible_book.name; end if;
  if not exists(select 1 from public.emmaus_bible_translations where code=p_translation) then
    raise exception 'Unknown translation: %',p_translation;
  end if;

  record_status:=case when p_publish then 'published' else 'draft' end;

  insert into public.emmaus_scripture_import_batches(
    translation,book_key,chapter_start,chapter_end,expected_verse_count,
    imported_verse_count,source_label,status,created_by
  ) values(
    p_translation,p_book_key,p_chapter,p_chapter,jsonb_array_length(p_verses),0,
    coalesce(p_source_label,p_translation||' '||bible_book.name||' '||p_chapter),
    'importing',auth.uid()
  ) returning id into batch_id;

  chapter_node_id:=public.ensure_emmaus_chapter_graph_node(p_book_key,p_chapter);

  for verse_item in select value from jsonb_array_elements(p_verses)
  loop
    verse_number:=coalesce((verse_item->>'verse')::integer,(verse_item->>'verse_number')::integer);
    verse_text:=trim(coalesce(verse_item->>'text',verse_item->>'verse_text',''));

    if verse_number is null or verse_number<1 then raise exception 'Every verse requires a positive verse number'; end if;
    if verse_text='' then raise exception 'Verse % has no text',verse_number; end if;

    v_reference_key:=p_book_key||'-'||p_chapter||'-'||verse_number;
    v_reference_label:=bible_book.name||' '||p_chapter||':'||verse_number;
    scripture_id:=null;
    graph_node_id:=null;

    select s.id,s.graph_node_id into scripture_id,graph_node_id
    from public.emmaus_scripture_nodes s
    where s.translation=p_translation and s.reference_key=v_reference_key
    limit 1;

    if scripture_id is null then
      insert into public.emmaus_scripture_nodes(
        reference_key,book,book_key,chapter,verse_start,reference_label,text_content,
        translation,testament,canonical_order,status,source_batch_id,created_by
      ) values(
        v_reference_key,bible_book.name,p_book_key,p_chapter,verse_number,v_reference_label,verse_text,
        p_translation,bible_book.testament,bible_book.canonical_order,record_status,batch_id,auth.uid()
      ) returning id into scripture_id;
      imported_count:=imported_count+1;
    else
      update public.emmaus_scripture_nodes set
        text_content=verse_text,
        reference_label=v_reference_label,
        status=record_status,
        source_batch_id=batch_id,
        updated_at=now()
      where id=scripture_id;
      updated_count:=updated_count+1;
    end if;

    graph_node_id:=public.link_emmaus_scripture_to_graph(scripture_id);

    update public.emmaus_graph_nodes set
      summary=verse_text,
      title=v_reference_label,
      subtitle=p_translation,
      scripture_reference=v_reference_label,
      status=record_status,
      metadata=metadata||jsonb_build_object(
        'translation',p_translation,'book',bible_book.name,'book_key',p_book_key,
        'chapter',p_chapter,'verse_start',verse_number,'canonical_order',bible_book.canonical_order
      ),
      updated_at=now()
    where id=graph_node_id;

    insert into public.emmaus_graph_edges(
      source_node_id,target_node_id,relationship_key,explanation,status,metadata
    ) values(
      graph_node_id,chapter_node_id,'part_of',v_reference_label||' is part of '||bible_book.name||' '||p_chapter||'.',
      record_status,jsonb_build_object('structural',true,'translation',p_translation)
    ) on conflict(source_node_id,target_node_id,relationship_key) do update set
      status=excluded.status,explanation=excluded.explanation,
      metadata=public.emmaus_graph_edges.metadata||excluded.metadata,updated_at=now();

    if previous_graph_node_id is not null then
      insert into public.emmaus_graph_edges(
        source_node_id,target_node_id,relationship_key,explanation,status,metadata
      ) values(
        previous_graph_node_id,graph_node_id,'recommended_next','Continue reading to the next verse.',
        record_status,jsonb_build_object('sequence',true,'translation',p_translation)
      ) on conflict(source_node_id,target_node_id,relationship_key) do update set
        status=excluded.status,metadata=public.emmaus_graph_edges.metadata||excluded.metadata,updated_at=now();
    end if;

    previous_graph_node_id:=graph_node_id;

    if p_queue_enrichment then
      insert into public.emmaus_scripture_enrichment_queue(scripture_node_id,enrichment_type,priority,metadata)
      select scripture_id,enrichment_type,priority,
        jsonb_build_object('book_key',p_book_key,'chapter',p_chapter,'verse',verse_number,'translation',p_translation)
      from (values
        ('people',40),('places',35),('events',45),('themes',60),
        ('questions',65),('language',30),('cross_references',55),('historical_context',25)
      ) q(enrichment_type,priority)
      on conflict(scripture_node_id,enrichment_type) do nothing;
      queued_count:=queued_count+8;
    end if;
  end loop;

  update public.emmaus_scripture_import_batches set
    imported_verse_count=imported_count+updated_count,
    status='verified',
    completed_at=now(),
    verified_at=now()
  where id=batch_id;

  return jsonb_build_object(
    'batch_id',batch_id,
    'translation',p_translation,
    'book_key',p_book_key,
    'chapter',p_chapter,
    'inserted',imported_count,
    'updated',updated_count,
    'enrichment_tasks_created',queued_count,
    'chapter_graph_node_id',chapter_node_id,
    'status',record_status
  );
exception when others then
  if batch_id is not null then
    update public.emmaus_scripture_import_batches set
      status='failed',error_message=sqlerrm,completed_at=now()
    where id=batch_id;
  end if;
  raise;
end;
$$;

grant execute on function public.import_emmaus_scripture_chapter(text,text,integer,jsonb,text,boolean,boolean) to authenticated;

create or replace function public.get_emmaus_enrichment_backlog(
  p_book_key text default null,
  p_limit integer default 100
)
returns table(
  queue_id uuid,
  scripture_node_id uuid,
  reference_label text,
  text_content text,
  enrichment_type text,
  priority integer,
  status text,
  notes text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path=public
as $$
  select q.id,s.id,s.reference_label,s.text_content,q.enrichment_type,q.priority,q.status,q.notes,q.created_at
  from public.emmaus_scripture_enrichment_queue q
  join public.emmaus_scripture_nodes s on s.id=q.scripture_node_id
  where public.is_emmaus_admin()
    and q.status in ('pending','in_progress')
    and (p_book_key is null or s.book_key=p_book_key)
  order by q.priority desc,s.canonical_order,s.chapter,s.verse_start,q.created_at
  limit greatest(1,least(coalesce(p_limit,100),500));
$$;

grant execute on function public.get_emmaus_enrichment_backlog(text,integer) to authenticated;
