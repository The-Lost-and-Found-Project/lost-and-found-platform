-- Public-domain KJV text for John 3 with semantic graph enrichment.

with verse_data(verse_number, verse_text) as (
  values
  (1,$$There was a man of the Pharisees, named Nicodemus, a ruler of the Jews:$$),
  (2,$$The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God: for no man can do these miracles that thou doest, except God be with him.$$),
  (3,$$Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.$$),
  (4,$$Nicodemus saith unto him, How can a man be born when he is old? can he enter the second time into his mother's womb, and be born?$$),
  (5,$$Jesus answered, Verily, verily, I say unto thee, Except a man be born of water and of the Spirit, he cannot enter into the kingdom of God.$$),
  (6,$$That which is born of the flesh is flesh; and that which is born of the Spirit is spirit.$$),
  (7,$$Marvel not that I said unto thee, Ye must be born again.$$),
  (8,$$The wind bloweth where it listeth, and thou hearest the sound thereof, but canst not tell whence it cometh, and whither it goeth: so is every one that is born of the Spirit.$$),
  (9,$$Nicodemus answered and said unto him, How can these things be?$$),
  (10,$$Jesus answered and said unto him, Art thou a master of Israel, and knowest not these things?$$),
  (11,$$Verily, verily, I say unto thee, We speak that we do know, and testify that we have seen; and ye receive not our witness.$$),
  (12,$$If I have told you earthly things, and ye believe not, how shall ye believe, if I tell you of heavenly things?$$),
  (13,$$And no man hath ascended up to heaven, but he that came down from heaven, even the Son of man which is in heaven.$$),
  (14,$$And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up:$$),
  (15,$$That whosoever believeth in him should not perish, but have eternal life.$$),
  (16,$$For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.$$),
  (17,$$For God sent not his Son into the world to condemn the world; but that the world through him might be saved.$$),
  (18,$$He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.$$),
  (19,$$And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.$$),
  (20,$$For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.$$),
  (21,$$But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God.$$),
  (22,$$After these things came Jesus and his disciples into the land of Judaea; and there he tarried with them, and baptized.$$),
  (23,$$And John also was baptizing in Aenon near to Salim, because there was much water there: and they came, and were baptized.$$),
  (24,$$For John was not yet cast into prison.$$),
  (25,$$Then there arose a question between some of John's disciples and the Jews about purifying.$$),
  (26,$$And they came unto John, and said unto him, Rabbi, he that was with thee beyond Jordan, to whom thou barest witness, behold, the same baptizeth, and all men come to him.$$),
  (27,$$John answered and said, A man can receive nothing, except it be given him from heaven.$$),
  (28,$$Ye yourselves bear me witness, that I said, I am not the Christ, but that I am sent before him.$$),
  (29,$$He that hath the bride is the bridegroom: but the friend of the bridegroom, which standeth and heareth him, rejoiceth greatly because of the bridegroom's voice: this my joy therefore is fulfilled.$$),
  (30,$$He must increase, but I must decrease.$$),
  (31,$$He that cometh from above is above all: he that is of the earth is earthly, and speaketh of the earth: he that cometh from heaven is above all.$$),
  (32,$$And what he hath seen and heard, that he testifieth; and no man receiveth his testimony.$$),
  (33,$$He that hath received his testimony hath set to his seal that God is true.$$),
  (34,$$For he whom God hath sent speaketh the words of God: for God giveth not the Spirit by measure unto him.$$),
  (35,$$The Father loveth the Son, and hath given all things into his hand.$$),
  (36,$$He that believeth on the Son hath everlasting life: and he that believeth not the Son shall not see life; but the wrath of God abideth on him.$$)
),
batch as (
  insert into public.emmaus_scripture_import_batches (
    translation,book_key,chapter_start,chapter_end,expected_verse_count,
    imported_verse_count,source_label,status,completed_at,verified_at
  ) values (
    'KJV','john',3,3,36,36,'Public-domain KJV John 3','verified',now(),now()
  ) returning id
),
inserted_scripture as (
  insert into public.emmaus_scripture_nodes (
    reference_key,book,book_key,chapter,verse_start,reference_label,text_content,
    translation,testament,canonical_order,status,source_batch_id
  )
  select 'john-3-'||v.verse_number,'John','john',3,v.verse_number,
    'John 3:'||v.verse_number,v.verse_text,'KJV','new',43,'published',batch.id
  from verse_data v cross join batch
  on conflict (translation,reference_key) do update set
    text_content=excluded.text_content,reference_label=excluded.reference_label,
    status='published',source_batch_id=excluded.source_batch_id,updated_at=now()
  returning id,reference_key,reference_label,text_content,verse_start
),
graph_nodes as (
  insert into public.emmaus_graph_nodes (
    node_key,node_type,title,subtitle,summary,scripture_reference,status,metadata
  )
  select 'scripture:kjv:'||s.reference_key,'verse',s.reference_label,'KJV',s.text_content,
    s.reference_label,'published',jsonb_build_object(
      'scripture_id',s.id,'translation','KJV','book','John','book_key','john',
      'chapter',3,'verse_start',s.verse_start,'canonical_order',43
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
from graph_nodes g where s.id=g.scripture_id;

insert into public.emmaus_graph_nodes(node_key,node_type,title,subtitle,summary,scripture_reference,status,metadata)
values
('bible-chapter:john:3','passage','John 3','KJV chapter','Jesus teaches Nicodemus about new birth, the lifted-up Son, belief, light, and eternal life.','John 3','published',jsonb_build_object('book_key','john','chapter',3,'canonical_order',43)),
('event:john-3-nicodemus-at-night','event','Nicodemus Comes by Night','A ruler seeks Jesus','Nicodemus approaches Jesus by night and hears that entering God’s kingdom requires new birth.','John 3:1-21','published',jsonb_build_object('book','john','chapter',3)),
('event:john-3-final-witness','event','John the Baptist’s Final Witness','He must increase','John rejoices in Jesus’s growing ministry and embraces his own decreasing role.','John 3:22-36','published',jsonb_build_object('book','john','chapter',3)),
('theme:new-birth','theme','New Birth','Born from above by the Spirit','Jesus teaches that spiritual birth, not natural descent, is necessary to see and enter God’s kingdom.','John 3:3-8','published',jsonb_build_object('book','john','chapter',3)),
('theme:kingdom-of-god','theme','Kingdom of God','God’s saving reign','Jesus connects new birth with seeing and entering the kingdom of God.','John 3:3,5','published',jsonb_build_object('book','john')),
('theme:eternal-life','theme','Eternal Life','Life through believing in the Son','John presents eternal life as the present possession of those who believe in the Son.','John 3:15-16,36','published',jsonb_build_object('book','john')),
('theme:judgment','theme','Judgment','Light exposes the heart','Judgment is revealed in humanity’s response to the Light and the Son.','John 3:17-21,36','published',jsonb_build_object('book','john')),
('theme:humility','theme','Humility','He must increase','John the Baptist models joyful humility by embracing Jesus’s increase and his own decrease.','John 3:27-30','published',jsonb_build_object('book','john')),
('language:anothen','language_term','Anōthen','Greek: ἄνωθεν','A Greek word that can mean again, from above, or anew, shaping Jesus’s teaching on spiritual birth.','John 3:3,7','published',jsonb_build_object('language','Greek','lemma','ἄνωθεν','transliteration','anothen','book','john','chapter',3)),
('language:pneuma','language_term','Pneuma','Greek: πνεῦμα','A Greek word that can mean spirit, wind, or breath, creating the wordplay in John 3:8.','John 3:5-8','published',jsonb_build_object('language','Greek','lemma','πνεῦμα','transliteration','pneuma','book','john','chapter',3)),
('passage:numbers-21-bronze-serpent','passage','The Bronze Serpent','Look and live','Moses lifts up the bronze serpent so that those who look in faith may live.','Numbers 21:4-9','published',jsonb_build_object('book','numbers','alluded_by','john-3')),
('passage:ezekiel-36-new-heart-spirit','passage','A New Heart and Spirit','Cleansing and renewal','God promises cleansing, a new heart, and His Spirit within His people.','Ezekiel 36:25-27','published',jsonb_build_object('book','ezekiel','alluded_by','john-3')),
('discovery:born-from-above','discovery','Born from Above','The Spirit gives new life','Jesus calls for a birth that originates from God rather than human effort or ancestry.','John 3:3-8','published',jsonb_build_object('book','john','chapter',3)),
('discovery:lifted-up-son','discovery','The Son Lifted Up','The cross as saving revelation','Jesus compares His future lifting up to Moses lifting the serpent in the wilderness.','John 3:14-15','published',jsonb_build_object('book','john','chapter',3)),
('discovery:god-loved-the-world','discovery','God Loved the World','The Father gives the Son','God’s love is revealed in giving His unique Son so believers may have everlasting life.','John 3:16-17','published',jsonb_build_object('book','john','chapter',3)),
('discovery:increase-decrease','discovery','He Must Increase','Joyful surrender to Jesus’s supremacy','John the Baptist’s mission finds fulfillment as attention shifts fully to Christ.','John 3:27-30','published',jsonb_build_object('book','john','chapter',3)),
('question:john-3-born-again','question','What kind of birth is Jesus describing?','Compare flesh and Spirit','Why does Nicodemus hear a second physical birth while Jesus speaks of birth from above?','John 3:3-8','published',jsonb_build_object('book','john','chapter',3,'stage','interpretation')),
('question:john-3-water-spirit','question','What does water and Spirit recall?','Trace Israel’s promised renewal','How might Ezekiel 36 help explain Jesus’s expectation that a teacher of Israel should understand?','John 3:5,10','published',jsonb_build_object('book','john','chapter',3,'stage','connection')),
('question:john-3-serpent','question','How is Jesus like the lifted serpent?','Study the pattern of looking and living','What similarities and differences connect Numbers 21 with the Son of Man being lifted up?','John 3:14-15','published',jsonb_build_object('book','john','chapter',3,'stage','connection')),
('question:john-3-light','question','Why do people avoid the Light?','Examine belief and exposure','What does Jesus reveal about the connection between deeds, truth, and coming to the Light?','John 3:18-21','published',jsonb_build_object('book','john','chapter',3,'stage','application')),
('question:john-3-increase','question','What makes John’s joy complete?','Observe surrendered leadership','How does John respond when others see Jesus’s growing influence as a threat?','John 3:26-30','published',jsonb_build_object('book','john','chapter',3,'stage','application'))
on conflict(node_key) do update set
  node_type=excluded.node_type,title=excluded.title,subtitle=excluded.subtitle,
  summary=excluded.summary,scripture_reference=excluded.scripture_reference,
  status='published',metadata=public.emmaus_graph_nodes.metadata||excluded.metadata,updated_at=now();

insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,explanation,status,metadata)
select c.id,b.id,'part_of','John 3 is part of the Gospel of John.','published',jsonb_build_object('structural',true)
from public.emmaus_graph_nodes c cross join public.emmaus_graph_nodes b
where c.node_key='bible-chapter:john:3' and b.node_key='bible-book:john'
on conflict(source_node_id,target_node_id,relationship_key) do nothing;

insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,explanation,status,metadata)
select v.id,c.id,'part_of',v.title||' is part of John 3.','published',jsonb_build_object('structural',true,'translation','KJV')
from public.emmaus_graph_nodes v cross join public.emmaus_graph_nodes c
where v.node_key like 'scripture:kjv:john-3-%' and c.node_key='bible-chapter:john:3'
on conflict(source_node_id,target_node_id,relationship_key) do nothing;

insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,explanation,status,metadata)
select a.id,b.id,'recommended_next','Continue reading to the next verse.','published',jsonb_build_object('sequence',true,'translation','KJV')
from generate_series(1,35) n
join public.emmaus_graph_nodes a on a.node_key='scripture:kjv:john-3-'||n
join public.emmaus_graph_nodes b on b.node_key='scripture:kjv:john-3-'||(n+1)
on conflict(source_node_id,target_node_id,relationship_key) do nothing;

insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,weight,explanation,status,metadata)
select verse_node.id,target.id,m.relationship_key,m.weight,m.explanation,'published',jsonb_build_object('seed','kjv-john-3')
from (
  values
  (1,21,'event:john-3-nicodemus-at-night','features_event',1.5,'These verses narrate Jesus’s nighttime conversation with Nicodemus.'),
  (1,10,'person:nicodemus','features_person',1.4,'Nicodemus receives Jesus’s teaching on new birth.'),
  (2,2,'theme:signs-and-belief','develops_theme',1.2,'Nicodemus approaches Jesus because of the signs.'),
  (3,8,'theme:new-birth','develops_theme',1.7,'Jesus explains the necessity and nature of new birth.'),
  (3,8,'discovery:born-from-above','develops_theme',1.7,'The passage develops birth from above by the Spirit.'),
  (3,7,'language:anothen','uses_term',1.6,'The word anothen carries the sense of again and from above.'),
  (5,8,'language:pneuma','uses_term',1.6,'Pneuma creates the Spirit-wind wordplay in Jesus’s explanation.'),
  (3,5,'theme:kingdom-of-god','develops_theme',1.5,'New birth is necessary to see and enter God’s kingdom.'),
  (5,10,'passage:ezekiel-36-new-heart-spirit','alludes_to',1.5,'Water and Spirit recall Israel’s promised cleansing and renewal.'),
  (3,8,'question:john-3-born-again','recommended_next',1.4,'The learner is invited to distinguish physical birth from birth from above.'),
  (5,10,'question:john-3-water-spirit','recommended_next',1.4,'Ezekiel’s promise helps explain Jesus’s rebuke of Nicodemus.'),
  (14,15,'passage:numbers-21-bronze-serpent','alludes_to',1.8,'Jesus explicitly compares His lifting up with Moses lifting the serpent.'),
  (14,15,'discovery:lifted-up-son','develops_theme',1.7,'The lifted-up Son becomes the object of saving belief.'),
  (14,15,'question:john-3-serpent','recommended_next',1.5,'The Numbers 21 pattern clarifies looking, believing, and living.'),
  (15,18,'theme:eternal-life','develops_theme',1.7,'Belief in the Son is connected with eternal life.'),
  (16,17,'discovery:god-loved-the-world','develops_theme',1.8,'God’s love is revealed in sending and giving the Son.'),
  (16,17,'theme:love','develops_theme',1.6,'The Father’s love initiates the saving mission of the Son.'),
  (16,18,'theme:belief','develops_theme',1.6,'Believing in the Son determines life and condemnation.'),
  (17,21,'theme:judgment','develops_theme',1.6,'Judgment is exposed through humanity’s response to the Son and the Light.'),
  (19,21,'theme:light','develops_theme',1.6,'Light reveals deeds and the posture of the heart.'),
  (18,21,'question:john-3-light','recommended_next',1.4,'The passage invites reflection on why people resist exposure.'),
  (22,36,'event:john-3-final-witness','features_event',1.5,'These verses present John the Baptist’s final extended witness in the Gospel.'),
  (22,36,'person:john-the-baptist','features_person',1.5,'John responds to concern about Jesus’s growing ministry.'),
  (27,30,'theme:humility','develops_theme',1.7,'John embraces a God-given role that decreases as Christ increases.'),
  (27,30,'discovery:increase-decrease','develops_theme',1.7,'John’s joy is fulfilled through Jesus’s increase.'),
  (26,30,'question:john-3-increase','recommended_next',1.4,'John’s response models surrendered leadership and joy.'),
  (31,36,'theme:witness','develops_theme',1.5,'The one from heaven testifies to what He has seen and heard.'),
  (31,36,'theme:spirit','develops_theme',1.4,'God gives the Spirit without measure to the Son.'),
  (31,36,'theme:eternal-life','develops_theme',1.7,'The chapter closes by contrasting life in the Son with abiding wrath.')
) as m(verse_start,verse_end,target_key,relationship_key,weight,explanation)
join generate_series(m.verse_start,m.verse_end) vnum on true
join public.emmaus_graph_nodes verse_node on verse_node.node_key='scripture:kjv:john-3-'||vnum
join public.emmaus_graph_nodes target on target.node_key=m.target_key
on conflict(source_node_id,target_node_id,relationship_key) do update set
  weight=excluded.weight,explanation=excluded.explanation,status='published',
  metadata=public.emmaus_graph_edges.metadata||excluded.metadata,updated_at=now();
