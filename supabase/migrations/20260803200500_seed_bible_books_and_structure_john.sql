insert into public.emmaus_bible_books (book_key, name, abbreviation, testament, canonical_order, chapter_count)
values
('genesis','Genesis','Gen','old',1,50),('exodus','Exodus','Exod','old',2,40),('leviticus','Leviticus','Lev','old',3,27),('numbers','Numbers','Num','old',4,36),('deuteronomy','Deuteronomy','Deut','old',5,34),('joshua','Joshua','Josh','old',6,24),('judges','Judges','Judg','old',7,21),('ruth','Ruth','Ruth','old',8,4),('1-samuel','1 Samuel','1 Sam','old',9,31),('2-samuel','2 Samuel','2 Sam','old',10,24),('1-kings','1 Kings','1 Kgs','old',11,22),('2-kings','2 Kings','2 Kgs','old',12,25),('1-chronicles','1 Chronicles','1 Chr','old',13,29),('2-chronicles','2 Chronicles','2 Chr','old',14,36),('ezra','Ezra','Ezra','old',15,10),('nehemiah','Nehemiah','Neh','old',16,13),('esther','Esther','Esth','old',17,10),('job','Job','Job','old',18,42),('psalms','Psalms','Ps','old',19,150),('proverbs','Proverbs','Prov','old',20,31),('ecclesiastes','Ecclesiastes','Eccl','old',21,12),('song-of-solomon','Song of Solomon','Song','old',22,8),('isaiah','Isaiah','Isa','old',23,66),('jeremiah','Jeremiah','Jer','old',24,52),('lamentations','Lamentations','Lam','old',25,5),('ezekiel','Ezekiel','Ezek','old',26,48),('daniel','Daniel','Dan','old',27,12),('hosea','Hosea','Hos','old',28,14),('joel','Joel','Joel','old',29,3),('amos','Amos','Amos','old',30,9),('obadiah','Obadiah','Obad','old',31,1),('jonah','Jonah','Jonah','old',32,4),('micah','Micah','Mic','old',33,7),('nahum','Nahum','Nah','old',34,3),('habakkuk','Habakkuk','Hab','old',35,3),('zephaniah','Zephaniah','Zeph','old',36,3),('haggai','Haggai','Hag','old',37,2),('zechariah','Zechariah','Zech','old',38,14),('malachi','Malachi','Mal','old',39,4),('matthew','Matthew','Matt','new',40,28),('mark','Mark','Mark','new',41,16),('luke','Luke','Luke','new',42,24),('john','John','John','new',43,21),('acts','Acts','Acts','new',44,28),('romans','Romans','Rom','new',45,16),('1-corinthians','1 Corinthians','1 Cor','new',46,16),('2-corinthians','2 Corinthians','2 Cor','new',47,13),('galatians','Galatians','Gal','new',48,6),('ephesians','Ephesians','Eph','new',49,6),('philippians','Philippians','Phil','new',50,4),('colossians','Colossians','Col','new',51,4),('1-thessalonians','1 Thessalonians','1 Thess','new',52,5),('2-thessalonians','2 Thessalonians','2 Thess','new',53,3),('1-timothy','1 Timothy','1 Tim','new',54,6),('2-timothy','2 Timothy','2 Tim','new',55,4),('titus','Titus','Titus','new',56,3),('philemon','Philemon','Phlm','new',57,1),('hebrews','Hebrews','Heb','new',58,13),('james','James','Jas','new',59,5),('1-peter','1 Peter','1 Pet','new',60,5),('2-peter','2 Peter','2 Pet','new',61,3),('1-john','1 John','1 John','new',62,5),('2-john','2 John','2 John','new',63,1),('3-john','3 John','3 John','new',64,1),('jude','Jude','Jude','new',65,1),('revelation','Revelation','Rev','new',66,22)
on conflict (book_key) do update set
  name=excluded.name,
  abbreviation=excluded.abbreviation,
  testament=excluded.testament,
  canonical_order=excluded.canonical_order,
  chapter_count=excluded.chapter_count;

create or replace function public.ensure_emmaus_book_graph_node(p_book_key text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  bible_book public.emmaus_bible_books;
  node_id uuid;
begin
  if not public.is_emmaus_admin() then raise exception 'Not authorized'; end if;
  select * into bible_book from public.emmaus_bible_books where book_key=p_book_key;
  if bible_book.id is null then raise exception 'Unknown Bible book: %', p_book_key; end if;
  select id into node_id from public.emmaus_graph_nodes where node_key='bible-book:'||p_book_key;
  if node_id is null then
    insert into public.emmaus_graph_nodes(node_key,node_type,title,subtitle,summary,status,metadata)
    values('bible-book:'||p_book_key,'book',bible_book.name,bible_book.testament||' testament','The book of '||bible_book.name||'.','published',jsonb_build_object('book_key',bible_book.book_key,'canonical_order',bible_book.canonical_order,'chapter_count',bible_book.chapter_count,'testament',bible_book.testament))
    returning id into node_id;
  end if;
  return node_id;
end;
$$;

grant execute on function public.ensure_emmaus_book_graph_node(text) to authenticated;

create or replace function public.ensure_emmaus_chapter_graph_node(p_book_key text,p_chapter integer)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  bible_book public.emmaus_bible_books;
  book_node uuid;
  chapter_node uuid;
begin
  if not public.is_emmaus_admin() then raise exception 'Not authorized'; end if;
  select * into bible_book from public.emmaus_bible_books where book_key=p_book_key;
  if bible_book.id is null then raise exception 'Unknown Bible book: %', p_book_key; end if;
  if p_chapter<1 or p_chapter>bible_book.chapter_count then raise exception 'Invalid chapter'; end if;
  book_node:=public.ensure_emmaus_book_graph_node(p_book_key);
  select id into chapter_node from public.emmaus_graph_nodes where node_key='bible-chapter:'||p_book_key||':'||p_chapter;
  if chapter_node is null then
    insert into public.emmaus_graph_nodes(node_key,node_type,title,subtitle,scripture_reference,summary,status,metadata)
    values('bible-chapter:'||p_book_key||':'||p_chapter,'passage',bible_book.name||' '||p_chapter,'KJV chapter',bible_book.name||' '||p_chapter,'Chapter '||p_chapter||' of '||bible_book.name||'.','published',jsonb_build_object('book_key',p_book_key,'chapter',p_chapter,'canonical_order',bible_book.canonical_order))
    returning id into chapter_node;
  end if;
  insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,explanation,status,metadata)
  values(chapter_node,book_node,'part_of',bible_book.name||' '||p_chapter||' is part of '||bible_book.name||'.','published',jsonb_build_object('structural',true))
  on conflict(source_node_id,target_node_id,relationship_key) do nothing;
  return chapter_node;
end;
$$;

grant execute on function public.ensure_emmaus_chapter_graph_node(text,integer) to authenticated;

create or replace function public.structure_emmaus_scripture_book(p_translation text,p_book_key text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  verse_record public.emmaus_scripture_nodes;
  chapter_node uuid;
  verse_node uuid;
  previous_verse_node uuid:=null;
  previous_chapter integer:=null;
  linked integer:=0;
  structured integer:=0;
begin
  if not public.is_emmaus_admin() then raise exception 'Not authorized'; end if;
  perform public.ensure_emmaus_book_graph_node(p_book_key);
  for verse_record in
    select * from public.emmaus_scripture_nodes
    where translation=p_translation and book_key=p_book_key and status<>'archived'
    order by chapter,verse_start
  loop
    if verse_record.graph_node_id is null then
      verse_node:=public.link_emmaus_scripture_to_graph(verse_record.id);
      linked:=linked+1;
    else
      verse_node:=verse_record.graph_node_id;
    end if;
    chapter_node:=public.ensure_emmaus_chapter_graph_node(p_book_key,verse_record.chapter);
    insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,explanation,status,metadata)
    values(verse_node,chapter_node,'part_of',verse_record.reference_label||' is part of '||verse_record.book||' '||verse_record.chapter||'.','published',jsonb_build_object('structural',true,'translation',p_translation))
    on conflict(source_node_id,target_node_id,relationship_key) do nothing;
    if previous_verse_node is not null and previous_chapter=verse_record.chapter then
      insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,explanation,status,metadata)
      values(previous_verse_node,verse_node,'recommended_next','Continue reading to the next verse.','published',jsonb_build_object('sequence',true,'translation',p_translation))
      on conflict(source_node_id,target_node_id,relationship_key) do nothing;
    end if;
    previous_verse_node:=verse_node;
    previous_chapter:=verse_record.chapter;
    structured:=structured+1;
  end loop;
  return jsonb_build_object('book_key',p_book_key,'translation',p_translation,'linked_to_graph',linked,'structured_verses',structured);
end;
$$;

grant execute on function public.structure_emmaus_scripture_book(text,text) to authenticated;

select public.ensure_emmaus_book_graph_node('john');
select public.ensure_emmaus_chapter_graph_node('john',chapter_number)
from generate_series(1,21) as chapter_number;
