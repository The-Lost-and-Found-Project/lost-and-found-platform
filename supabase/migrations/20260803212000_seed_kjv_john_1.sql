-- Public-domain KJV text for John 1, verified against Project Gutenberg Book 43.

with verse_data(verse_number, verse_text) as (
  values
  (1,$$In the beginning was the Word, and the Word was with God, and the Word was God.$$),
  (2,$$The same was in the beginning with God.$$),
  (3,$$All things were made by him; and without him was not any thing made that was made.$$),
  (4,$$In him was life; and the life was the light of men.$$),
  (5,$$And the light shineth in darkness; and the darkness comprehended it not.$$),
  (6,$$There was a man sent from God, whose name was John.$$),
  (7,$$The same came for a witness, to bear witness of the Light, that all men through him might believe.$$),
  (8,$$He was not that Light, but was sent to bear witness of that Light.$$),
  (9,$$That was the true Light, which lighteth every man that cometh into the world.$$),
  (10,$$He was in the world, and the world was made by him, and the world knew him not.$$),
  (11,$$He came unto his own, and his own received him not.$$),
  (12,$$But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:$$),
  (13,$$Which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God.$$),
  (14,$$And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.$$),
  (15,$$John bare witness of him, and cried, saying, This was he of whom I spake, He that cometh after me is preferred before me: for he was before me.$$),
  (16,$$And of his fulness have all we received, and grace for grace.$$),
  (17,$$For the law was given by Moses, but grace and truth came by Jesus Christ.$$),
  (18,$$No man hath seen God at any time, the only begotten Son, which is in the bosom of the Father, he hath declared him.$$),
  (19,$$And this is the record of John, when the Jews sent priests and Levites from Jerusalem to ask him, Who art thou?$$),
  (20,$$And he confessed, and denied not; but confessed, I am not the Christ.$$),
  (21,$$And they asked him, What then? Art thou Elias? And he saith, I am not. Art thou that prophet? And he answered, No.$$),
  (22,$$Then said they unto him, Who art thou? that we may give an answer to them that sent us. What sayest thou of thyself?$$),
  (23,$$He said, I am the voice of one crying in the wilderness, Make straight the way of the Lord, as said the prophet Esaias.$$),
  (24,$$And they which were sent were of the Pharisees.$$),
  (25,$$And they asked him, and said unto him, Why baptizest thou then, if thou be not that Christ, nor Elias, neither that prophet?$$),
  (26,$$John answered them, saying, I baptize with water: but there standeth one among you, whom ye know not;$$),
  (27,$$He it is, who coming after me is preferred before me, whose shoe's latchet I am not worthy to unloose.$$),
  (28,$$These things were done in Bethabara beyond Jordan, where John was baptizing.$$),
  (29,$$The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.$$),
  (30,$$This is he of whom I said, After me cometh a man which is preferred before me: for he was before me.$$),
  (31,$$And I knew him not: but that he should be made manifest to Israel, therefore am I come baptizing with water.$$),
  (32,$$And John bare record, saying, I saw the Spirit descending from heaven like a dove, and it abode upon him.$$),
  (33,$$And I knew him not: but he that sent me to baptize with water, the same said unto me, Upon whom thou shalt see the Spirit descending, and remaining on him, the same is he which baptizeth with the Holy Ghost.$$),
  (34,$$And I saw, and bare record that this is the Son of God.$$),
  (35,$$Again the next day after John stood, and two of his disciples;$$),
  (36,$$And looking upon Jesus as he walked, he saith, Behold the Lamb of God!$$),
  (37,$$And the two disciples heard him speak, and they followed Jesus.$$),
  (38,$$Then Jesus turned, and saw them following, and saith unto them, What seek ye? They said unto him, Rabbi, (which is to say, being interpreted, Master,) where dwellest thou?$$),
  (39,$$He saith unto them, Come and see. They came and saw where he dwelt, and abode with him that day: for it was about the tenth hour.$$),
  (40,$$One of the two which heard John speak, and followed him, was Andrew, Simon Peter's brother.$$),
  (41,$$He first findeth his own brother Simon, and saith unto him, We have found the Messias, which is, being interpreted, the Christ.$$),
  (42,$$And he brought him to Jesus. And when Jesus beheld him, he said, Thou art Simon the son of Jona: thou shalt be called Cephas, which is by interpretation, A stone.$$),
  (43,$$The day following Jesus would go forth into Galilee, and findeth Philip, and saith unto him, Follow me.$$),
  (44,$$Now Philip was of Bethsaida, the city of Andrew and Peter.$$),
  (45,$$Philip findeth Nathanael, and saith unto him, We have found him, of whom Moses in the law, and the prophets, did write, Jesus of Nazareth, the son of Joseph.$$),
  (46,$$And Nathanael said unto him, Can there any good thing come out of Nazareth? Philip saith unto him, Come and see.$$),
  (47,$$Jesus saw Nathanael coming to him, and saith of him, Behold an Israelite indeed, in whom is no guile!$$),
  (48,$$Nathanael saith unto him, Whence knowest thou me? Jesus answered and said unto him, Before that Philip called thee, when thou wast under the fig tree, I saw thee.$$),
  (49,$$Nathanael answered and saith unto him, Rabbi, thou art the Son of God; thou art the King of Israel.$$),
  (50,$$Jesus answered and said unto him, Because I said unto thee, I saw thee under the fig tree, believest thou? thou shalt see greater things than these.$$),
  (51,$$And he saith unto him, Verily, verily, I say unto you, Hereafter ye shall see heaven open, and the angels of God ascending and descending upon the Son of man.$$)
),
batch as (
  insert into public.emmaus_scripture_import_batches (
    translation,book_key,chapter_start,chapter_end,expected_verse_count,
    imported_verse_count,source_label,status,completed_at,verified_at
  ) values (
    'KJV','john',1,1,51,51,'Public-domain KJV John 1; verified against Project Gutenberg Book 43','verified',now(),now()
  )
  returning id
),
inserted_scripture as (
  insert into public.emmaus_scripture_nodes (
    reference_key,book,book_key,chapter,verse_start,reference_label,text_content,
    translation,testament,canonical_order,status,source_batch_id
  )
  select
    'john-1-'||v.verse_number,
    'John','john',1,v.verse_number,'John 1:'||v.verse_number,v.verse_text,
    'KJV','new',43,'published',batch.id
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
    'scripture:kjv:'||s.reference_key,
    'verse',s.reference_label,'KJV',s.text_content,s.reference_label,'published',
    jsonb_build_object(
      'scripture_id',s.id,'translation','KJV','book','John','book_key','john',
      'chapter',1,'verse_start',s.verse_start,'canonical_order',43
    )
  from inserted_scripture s
  on conflict (node_key) do update set
    title=excluded.title,
    subtitle=excluded.subtitle,
    summary=excluded.summary,
    scripture_reference=excluded.scripture_reference,
    status='published',
    metadata=public.emmaus_graph_nodes.metadata||excluded.metadata,
    updated_at=now()
  returning id,node_key,(metadata->>'scripture_id')::uuid as scripture_id
)
update public.emmaus_scripture_nodes s
set graph_node_id=g.id,updated_at=now()
from graph_nodes g
where s.id=g.scripture_id;

-- Ensure the structural parent nodes exist without relying on an authenticated session.
insert into public.emmaus_graph_nodes (node_key,node_type,title,subtitle,summary,status,metadata)
values ('bible-book:john','book','John','new testament','The Gospel according to John.','published',jsonb_build_object('book_key','john','canonical_order',43,'chapter_count',21,'testament','new'))
on conflict (node_key) do nothing;

insert into public.emmaus_graph_nodes (node_key,node_type,title,subtitle,scripture_reference,summary,status,metadata)
values ('bible-chapter:john:1','passage','John 1','KJV chapter','John 1','Chapter 1 of John.','published',jsonb_build_object('book_key','john','chapter',1,'canonical_order',43))
on conflict (node_key) do nothing;

insert into public.emmaus_graph_edges (source_node_id,target_node_id,relationship_key,explanation,status,metadata)
select c.id,b.id,'part_of','John 1 is part of the Gospel of John.','published',jsonb_build_object('structural',true)
from public.emmaus_graph_nodes c
cross join public.emmaus_graph_nodes b
where c.node_key='bible-chapter:john:1' and b.node_key='bible-book:john'
on conflict (source_node_id,target_node_id,relationship_key) do nothing;

insert into public.emmaus_graph_edges (source_node_id,target_node_id,relationship_key,explanation,status,metadata)
select v.id,c.id,'part_of',v.title||' is part of John 1.','published',jsonb_build_object('structural',true,'translation','KJV')
from public.emmaus_graph_nodes v
cross join public.emmaus_graph_nodes c
where v.node_key like 'scripture:kjv:john-1-%' and c.node_key='bible-chapter:john:1'
on conflict (source_node_id,target_node_id,relationship_key) do nothing;

insert into public.emmaus_graph_edges (source_node_id,target_node_id,relationship_key,explanation,status,metadata)
select current_node.id,next_node.id,'recommended_next','Continue reading to the next verse.','published',jsonb_build_object('sequence',true,'translation','KJV')
from generate_series(1,50) n
join public.emmaus_graph_nodes current_node on current_node.node_key='scripture:kjv:john-1-'||n
join public.emmaus_graph_nodes next_node on next_node.node_key='scripture:kjv:john-1-'||(n+1)
on conflict (source_node_id,target_node_id,relationship_key) do nothing;

-- Attach the semantic layer directly to the imported verses.
insert into public.emmaus_graph_edges (source_node_id,target_node_id,relationship_key,weight,explanation,status,metadata)
select verse_node.id,semantic_node.id,m.relationship_key,m.weight,m.explanation,'published',jsonb_build_object('seed','kjv-john-1')
from (
  values
  (1,3,'language:logos','uses_term',1.5,'John identifies Jesus as the eternal Word.'),
  (1,3,'theme:creation','develops_theme',1.5,'The Word is presented as active in creation.'),
  (1,3,'passage:genesis-1-1-5','alludes_to',1.6,'The opening deliberately echoes Genesis 1.'),
  (4,9,'theme:life','develops_theme',1.4,'Life is located in the Word.'),
  (4,9,'theme:light','develops_theme',1.4,'The true Light shines in darkness and gives light.'),
  (6,8,'person:john-the-baptist','features_person',1.3,'John is introduced as a witness to the Light.'),
  (6,8,'theme:witness','develops_theme',1.3,'John’s role is to bear witness so others may believe.'),
  (10,13,'theme:belief','develops_theme',1.4,'Receiving and believing in Christ forms the decisive response.'),
  (12,13,'theme:new-identity','develops_theme',1.4,'Believers are given authority to become children of God.'),
  (14,18,'discovery:word-became-flesh','develops_theme',1.6,'The eternal Word becomes flesh and reveals the Father.'),
  (14,18,'theme:incarnation','develops_theme',1.5,'These verses explain the incarnation.'),
  (14,18,'theme:glory','develops_theme',1.4,'The incarnate Son reveals divine glory.'),
  (14,18,'theme:grace','develops_theme',1.4,'Grace and truth come through Jesus Christ.'),
  (14,14,'language:eskēnōsen','uses_term',1.5,'The dwelling language evokes the tabernacle.'),
  (19,28,'person:john-the-baptist','features_person',1.3,'John testifies concerning his identity and mission.'),
  (19,28,'theme:witness','develops_theme',1.3,'This section develops John’s witness.'),
  (23,23,'passage:isaiah-40-3','quotes',1.6,'John applies Isaiah’s wilderness voice to his ministry.'),
  (29,36,'discovery:lamb-of-god','develops_theme',1.6,'John identifies Jesus as the Lamb of God.'),
  (29,36,'passage:exodus-12-passover-lamb','alludes_to',1.5,'The Lamb title evokes sacrifice and Passover deliverance.'),
  (32,34,'theme:spirit','develops_theme',1.4,'The Spirit descends and remains upon Jesus.'),
  (35,42,'discovery:come-and-see','develops_theme',1.4,'The first disciples follow through witness and encounter.'),
  (40,42,'person:andrew','features_person',1.2,'Andrew follows Jesus and brings Peter.'),
  (42,42,'person:peter','features_person',1.2,'Jesus gives Simon a new name and future identity.'),
  (43,50,'discovery:come-and-see','develops_theme',1.4,'Philip invites Nathanael to come and see.'),
  (43,46,'person:philip','features_person',1.2,'Philip is called and becomes a witness.'),
  (45,50,'person:nathanael','features_person',1.2,'Nathanael encounters Jesus and confesses Him.'),
  (51,51,'discovery:heaven-opened','develops_theme',1.6,'Jesus presents Himself as the meeting place of heaven and earth.'),
  (51,51,'passage:genesis-28-jacob-ladder','alludes_to',1.7,'Jesus alludes to Jacob’s ladder.')
) as m(verse_start,verse_end,target_key,relationship_key,weight,explanation)
join generate_series(m.verse_start,m.verse_end) verse_number on true
join public.emmaus_graph_nodes verse_node on verse_node.node_key='scripture:kjv:john-1-'||verse_number
join public.emmaus_graph_nodes semantic_node on semantic_node.node_key=m.target_key
on conflict (source_node_id,target_node_id,relationship_key) do update set
  weight=excluded.weight,
  explanation=excluded.explanation,
  status='published',
  metadata=public.emmaus_graph_edges.metadata||excluded.metadata,
  updated_at=now();
