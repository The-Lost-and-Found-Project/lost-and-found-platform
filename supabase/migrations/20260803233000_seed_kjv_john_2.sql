-- Public-domain KJV text for John 2, verified against Project Gutenberg and Bible Gateway.

with verse_data(verse_number, verse_text) as (
  values
  (1,$$And the third day there was a marriage in Cana of Galilee; and the mother of Jesus was there:$$),
  (2,$$And both Jesus was called, and his disciples, to the marriage.$$),
  (3,$$And when they wanted wine, the mother of Jesus saith unto him, They have no wine.$$),
  (4,$$Jesus saith unto her, Woman, what have I to do with thee? mine hour is not yet come.$$),
  (5,$$His mother saith unto the servants, Whatsoever he saith unto you, do it.$$),
  (6,$$And there were set there six waterpots of stone, after the manner of the purifying of the Jews, containing two or three firkins apiece.$$),
  (7,$$Jesus saith unto them, Fill the waterpots with water. And they filled them up to the brim.$$),
  (8,$$And he saith unto them, Draw out now, and bear unto the governor of the feast. And they bare it.$$),
  (9,$$When the ruler of the feast had tasted the water that was made wine, and knew not whence it was: (but the servants which drew the water knew;) the governor of the feast called the bridegroom,$$),
  (10,$$And saith unto him, Every man at the beginning doth set forth good wine; and when men have well drunk, then that which is worse: but thou hast kept the good wine until now.$$),
  (11,$$This beginning of miracles did Jesus in Cana of Galilee, and manifested forth his glory; and his disciples believed on him.$$),
  (12,$$After this he went down to Capernaum, he, and his mother, and his brethren, and his disciples: and they continued there not many days.$$),
  (13,$$And the Jews' passover was at hand, and Jesus went up to Jerusalem,$$),
  (14,$$And found in the temple those that sold oxen and sheep and doves, and the changers of money sitting:$$),
  (15,$$And when he had made a scourge of small cords, he drove them all out of the temple, and the sheep, and the oxen; and poured out the changers' money, and overthrew the tables;$$),
  (16,$$And said unto them that sold doves, Take these things hence; make not my Father's house an house of merchandise.$$),
  (17,$$And his disciples remembered that it was written, The zeal of thine house hath eaten me up.$$),
  (18,$$Then answered the Jews and said unto him, What sign shewest thou unto us, seeing that thou doest these things?$$),
  (19,$$Jesus answered and said unto them, Destroy this temple, and in three days I will raise it up.$$),
  (20,$$Then said the Jews, Forty and six years was this temple in building, and wilt thou rear it up in three days?$$),
  (21,$$But he spake of the temple of his body.$$),
  (22,$$When therefore he was risen from the dead, his disciples remembered that he had said this unto them; and they believed the scripture, and the word which Jesus had said.$$),
  (23,$$Now when he was in Jerusalem at the passover, in the feast day, many believed in his name, when they saw the miracles which he did.$$),
  (24,$$But Jesus did not commit himself unto them, because he knew all men,$$),
  (25,$$And needed not that any should testify of man: for he knew what was in man.$$)
),
batch as (
  insert into public.emmaus_scripture_import_batches (
    translation,book_key,chapter_start,chapter_end,expected_verse_count,
    imported_verse_count,source_label,status,completed_at,verified_at
  ) values (
    'KJV','john',2,2,25,25,'Public-domain KJV John 2; verified against Project Gutenberg and Bible Gateway','verified',now(),now()
  ) returning id
),
inserted_scripture as (
  insert into public.emmaus_scripture_nodes (
    reference_key,book,book_key,chapter,verse_start,reference_label,text_content,
    translation,testament,canonical_order,status,source_batch_id
  )
  select
    'john-2-'||v.verse_number,'John','john',2,v.verse_number,
    'John 2:'||v.verse_number,v.verse_text,'KJV','new',43,'published',batch.id
  from verse_data v cross join batch
  on conflict (translation,reference_key) do update set
    text_content=excluded.text_content,
    reference_label=excluded.reference_label,
    book_key='john',
    testament='new',
    canonical_order=43,
    status='published',
    source_batch_id=excluded.source_batch_id,
    updated_at=now()
  returning id,reference_key,reference_label,text_content,verse_start
),
graph_nodes as (
  insert into public.emmaus_graph_nodes (
    node_key,node_type,title,subtitle,summary,scripture_reference,status,metadata
  )
  select
    'scripture:kjv:'||s.reference_key,'verse',s.reference_label,'KJV',s.text_content,
    s.reference_label,'published',jsonb_build_object(
      'scripture_id',s.id,'translation','KJV','book','John','book_key','john',
      'chapter',2,'verse_start',s.verse_start,'canonical_order',43
    )
  from inserted_scripture s
  on conflict (node_key) do update set
    title=excluded.title,subtitle=excluded.subtitle,summary=excluded.summary,
    scripture_reference=excluded.scripture_reference,status='published',
    metadata=public.emmaus_graph_nodes.metadata||excluded.metadata,updated_at=now()
  returning id,(metadata->>'scripture_id')::uuid as scripture_id
)
update public.emmaus_scripture_nodes s
set graph_node_id=g.id,updated_at=now()
from graph_nodes g
where s.id=g.scripture_id;

insert into public.emmaus_graph_nodes(node_key,node_type,title,subtitle,summary,scripture_reference,status,metadata)
values
('bible-chapter:john:2','passage','John 2','KJV chapter','The first sign at Cana and Jesus cleansing the temple.','John 2','published',jsonb_build_object('book_key','john','chapter',2,'canonical_order',43)),
('event:john-2-wedding-at-cana','event','The Wedding at Cana','Jesus performs the first sign','At a wedding in Cana, Jesus turns water into wine and manifests His glory.','John 2:1-11','published',jsonb_build_object('book','john','chapter',2)),
('event:john-2-cleansing-temple','event','Jesus Cleanses the Temple','Zeal for the Father’s house','Jesus drives merchants from the temple and identifies His body as the true temple.','John 2:13-22','published',jsonb_build_object('book','john','chapter',2)),
('theme:hour-of-jesus','theme','The Hour of Jesus','The appointed time of glorification','John’s Gospel uses the hour to point toward Jesus’s death, resurrection, and glorification.','John 2:4; 7:30; 12:23; 13:1; 17:1','published',jsonb_build_object('book','john')),
('theme:signs-and-belief','theme','Signs and Belief','Miracles that reveal identity','John’s signs reveal Jesus’s glory and call people toward genuine belief.','John 2:11,23-25; 20:30-31','published',jsonb_build_object('book','john')),
('theme:purification','theme','Purification','From ritual water to messianic abundance','The stone waterpots connect ritual purification with Jesus’s transforming provision.','John 2:6-10','published',jsonb_build_object('book','john','chapter',2)),
('theme:temple','theme','Temple','God’s dwelling and presence','John presents Jesus’s body as the true temple and locus of God’s presence.','John 2:19-21','published',jsonb_build_object('book','john')),
('theme:resurrection','theme','Resurrection','Raised on the third day','Jesus interprets the temple sign through His future resurrection.','John 2:19-22','published',jsonb_build_object('book','john')),
('place:capernaum','place','Capernaum','Galilean ministry center','Jesus, His family, and His disciples stay briefly in Capernaum after Cana.','John 2:12','published',jsonb_build_object('book','john')),
('discovery:water-to-wine','discovery','Water into Wine','Transformation and revealed glory','The first sign transforms purification water into abundant wine and leads the disciples to believe.','John 2:1-11','published',jsonb_build_object('book','john','chapter',2)),
('discovery:body-as-temple','discovery','The Body as Temple','Jesus replaces the temple center','Jesus speaks of His body as the temple that will be destroyed and raised in three days.','John 2:19-22','published',jsonb_build_object('book','john','chapter',2)),
('passage:psalm-69-9','passage','Zeal for God’s House','Messianic zeal and reproach','The disciples connect Jesus’s temple action with the psalmist’s consuming zeal.','Psalm 69:9','published',jsonb_build_object('book','psalms','quoted_in','john-2')),
('question:john-2-first-sign','question','Why is this called the beginning of signs?','Observe what the sign reveals','What does the transformation reveal about Jesus, glory, and belief beyond meeting an immediate need?','John 2:1-11','published',jsonb_build_object('book','john','chapter',2,'stage','interpretation')),
('question:john-2-waterpots','question','Why mention the purification waterpots?','Follow the symbolic detail','How does the purpose of the stone jars deepen the meaning of Jesus turning their water into wine?','John 2:6-10','published',jsonb_build_object('book','john','chapter',2,'stage','connection')),
('question:john-2-temple','question','Which temple is Jesus talking about?','Compare misunderstanding and meaning','Why do the listeners interpret Jesus literally, and what does John reveal in verse 21?','John 2:18-22','published',jsonb_build_object('book','john','chapter',2,'stage','interpretation')),
('question:john-2-belief','question','Is every kind of belief the same?','Compare verses 11 and 23-25','What difference might John be showing between the disciples’ belief and the crowds’ response to signs?','John 2:11,23-25','published',jsonb_build_object('book','john','chapter',2,'stage','reflection'))
on conflict(node_key) do update set
  node_type=excluded.node_type,title=excluded.title,subtitle=excluded.subtitle,
  summary=excluded.summary,scripture_reference=excluded.scripture_reference,
  status='published',metadata=public.emmaus_graph_nodes.metadata||excluded.metadata,updated_at=now();

insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,explanation,status,metadata)
select c.id,b.id,'part_of','John 2 is part of the Gospel of John.','published',jsonb_build_object('structural',true)
from public.emmaus_graph_nodes c cross join public.emmaus_graph_nodes b
where c.node_key='bible-chapter:john:2' and b.node_key='bible-book:john'
on conflict(source_node_id,target_node_id,relationship_key) do nothing;

insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,explanation,status,metadata)
select v.id,c.id,'part_of',v.title||' is part of John 2.','published',jsonb_build_object('structural',true,'translation','KJV')
from public.emmaus_graph_nodes v cross join public.emmaus_graph_nodes c
where v.node_key like 'scripture:kjv:john-2-%' and c.node_key='bible-chapter:john:2'
on conflict(source_node_id,target_node_id,relationship_key) do nothing;

insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,explanation,status,metadata)
select a.id,b.id,'recommended_next','Continue reading to the next verse.','published',jsonb_build_object('sequence',true,'translation','KJV')
from generate_series(1,24) n
join public.emmaus_graph_nodes a on a.node_key='scripture:kjv:john-2-'||n
join public.emmaus_graph_nodes b on b.node_key='scripture:kjv:john-2-'||(n+1)
on conflict(source_node_id,target_node_id,relationship_key) do nothing;

insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,weight,explanation,status,metadata)
select verse_node.id,target.id,m.relationship_key,m.weight,m.explanation,'published',jsonb_build_object('seed','kjv-john-2')
from (
  values
  (1,11,'event:john-2-wedding-at-cana','features_event',1.5,'These verses narrate the wedding at Cana and the first sign.'),
  (1,11,'place:cana','occurs_at',1.3,'The first sign occurs in Cana of Galilee.'),
  (3,10,'theme:purification','develops_theme',1.4,'The purification water becomes part of Jesus’s transforming sign.'),
  (4,4,'theme:hour-of-jesus','develops_theme',1.4,'Jesus introduces the theme of His appointed hour.'),
  (5,5,'question:john-2-first-sign','recommended_next',1.1,'Obedience to Jesus’s command prepares the reader to interpret the sign.'),
  (6,10,'question:john-2-waterpots','recommended_next',1.4,'The waterpots invite closer attention to purification imagery.'),
  (1,11,'discovery:water-to-wine','develops_theme',1.6,'The passage develops the water-to-wine discovery.'),
  (11,11,'event:john-sign-1-water-to-wine','features_event',1.7,'John explicitly identifies Cana as the beginning of Jesus’s signs.'),
  (11,11,'theme:glory','develops_theme',1.6,'The sign manifests Jesus’s glory.'),
  (11,11,'theme:belief','develops_theme',1.5,'The disciples respond to the sign by believing in Jesus.'),
  (11,11,'theme:signs-and-belief','develops_theme',1.6,'John ties signs, revealed glory, and belief together.'),
  (12,12,'place:capernaum','occurs_at',1.2,'Jesus and His companions stay briefly in Capernaum.'),
  (13,22,'event:john-2-cleansing-temple','features_event',1.5,'These verses narrate Jesus cleansing the temple.'),
  (13,13,'place:jerusalem','occurs_at',1.3,'Jesus goes to Jerusalem for Passover.'),
  (13,13,'passage:exodus-12-passover-lamb','alludes_to',1.3,'The Passover setting recalls Israel’s deliverance through the lamb.'),
  (14,17,'theme:temple','develops_theme',1.5,'Jesus’s action confronts corruption in His Father’s house.'),
  (17,17,'passage:psalm-69-9','quotes',1.6,'The disciples remember Psalm 69:9.'),
  (18,22,'question:john-2-temple','recommended_next',1.5,'The temple saying requires interpretation through resurrection.'),
  (19,22,'discovery:body-as-temple','develops_theme',1.7,'Jesus identifies His body as the temple to be raised.'),
  (19,22,'theme:resurrection','develops_theme',1.6,'The three-day temple sign points to Jesus’s resurrection.'),
  (19,22,'theme:temple','develops_theme',1.6,'Jesus relocates temple meaning to His own body.'),
  (22,22,'theme:belief','develops_theme',1.4,'After the resurrection, the disciples believe Scripture and Jesus’s word.'),
  (23,25,'theme:signs-and-belief','develops_theme',1.5,'The crowd’s sign-based belief is contrasted with Jesus’s knowledge of the human heart.'),
  (23,25,'question:john-2-belief','recommended_next',1.5,'The ending invites comparison between apparent and trustworthy belief.')
) as m(verse_start,verse_end,target_key,relationship_key,weight,explanation)
join generate_series(m.verse_start,m.verse_end) vnum on true
join public.emmaus_graph_nodes verse_node on verse_node.node_key='scripture:kjv:john-2-'||vnum
join public.emmaus_graph_nodes target on target.node_key=m.target_key
on conflict(source_node_id,target_node_id,relationship_key) do update set
  weight=excluded.weight,explanation=excluded.explanation,status='published',
  metadata=public.emmaus_graph_edges.metadata||excluded.metadata,updated_at=now();
