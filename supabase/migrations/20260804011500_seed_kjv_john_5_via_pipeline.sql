-- Import John 5 through the reusable Scripture pipeline and enrich its major discoveries.

select public.import_emmaus_scripture_chapter(
  'KJV','john',5,
  jsonb_build_array(
    jsonb_build_object('verse',1,'text',$$After this there was a feast of the Jews; and Jesus went up to Jerusalem.$$),
    jsonb_build_object('verse',2,'text',$$Now there is at Jerusalem by the sheep market a pool, which is called in the Hebrew tongue Bethesda, having five porches.$$),
    jsonb_build_object('verse',3,'text',$$In these lay a great multitude of impotent folk, of blind, halt, withered, waiting for the moving of the water.$$),
    jsonb_build_object('verse',4,'text',$$For an angel went down at a certain season into the pool, and troubled the water: whosoever then first after the troubling of the water stepped in was made whole of whatsoever disease he had.$$),
    jsonb_build_object('verse',5,'text',$$And a certain man was there, which had an infirmity thirty and eight years.$$),
    jsonb_build_object('verse',6,'text',$$When Jesus saw him lie, and knew that he had been now a long time in that case, he saith unto him, Wilt thou be made whole?$$),
    jsonb_build_object('verse',7,'text',$$The impotent man answered him, Sir, I have no man, when the water is troubled, to put me into the pool: but while I am coming, another steppeth down before me.$$),
    jsonb_build_object('verse',8,'text',$$Jesus saith unto him, Rise, take up thy bed, and walk.$$),
    jsonb_build_object('verse',9,'text',$$And immediately the man was made whole, and took up his bed, and walked: and on the same day was the sabbath.$$),
    jsonb_build_object('verse',10,'text',$$The Jews therefore said unto him that was cured, It is the sabbath day: it is not lawful for thee to carry thy bed.$$),
    jsonb_build_object('verse',11,'text',$$He answered them, He that made me whole, the same said unto me, Take up thy bed, and walk.$$),
    jsonb_build_object('verse',12,'text',$$Then asked they him, What man is that which said unto thee, Take up thy bed, and walk?$$),
    jsonb_build_object('verse',13,'text',$$And he that was healed wist not who it was: for Jesus had conveyed himself away, a multitude being in that place.$$),
    jsonb_build_object('verse',14,'text',$$Afterward Jesus findeth him in the temple, and said unto him, Behold, thou art made whole: sin no more, lest a worse thing come unto thee.$$),
    jsonb_build_object('verse',15,'text',$$The man departed, and told the Jews that it was Jesus, which had made him whole.$$),
    jsonb_build_object('verse',16,'text',$$And therefore did the Jews persecute Jesus, and sought to slay him, because he had done these things on the sabbath day.$$),
    jsonb_build_object('verse',17,'text',$$But Jesus answered them, My Father worketh hitherto, and I work.$$),
    jsonb_build_object('verse',18,'text',$$Therefore the Jews sought the more to kill him, because he not only had broken the sabbath, but said also that God was his Father, making himself equal with God.$$),
    jsonb_build_object('verse',19,'text',$$Then answered Jesus and said unto them, Verily, verily, I say unto you, The Son can do nothing of himself, but what he seeth the Father do: for what things soever he doeth, these also doeth the Son likewise.$$),
    jsonb_build_object('verse',20,'text',$$For the Father loveth the Son, and sheweth him all things that himself doeth: and he will shew him greater works than these, that ye may marvel.$$),
    jsonb_build_object('verse',21,'text',$$For as the Father raiseth up the dead, and quickeneth them; even so the Son quickeneth whom he will.$$),
    jsonb_build_object('verse',22,'text',$$For the Father judgeth no man, but hath committed all judgment unto the Son:$$),
    jsonb_build_object('verse',23,'text',$$That all men should honour the Son, even as they honour the Father. He that honoureth not the Son honoureth not the Father which hath sent him.$$),
    jsonb_build_object('verse',24,'text',$$Verily, verily, I say unto you, He that heareth my word, and believeth on him that sent me, hath everlasting life, and shall not come into condemnation; but is passed from death unto life.$$),
    jsonb_build_object('verse',25,'text',$$Verily, verily, I say unto you, The hour is coming, and now is, when the dead shall hear the voice of the Son of God: and they that hear shall live.$$),
    jsonb_build_object('verse',26,'text',$$For as the Father hath life in himself; so hath he given to the Son to have life in himself;$$),
    jsonb_build_object('verse',27,'text',$$And hath given him authority to execute judgment also, because he is the Son of man.$$),
    jsonb_build_object('verse',28,'text',$$Marvel not at this: for the hour is coming, in the which all that are in the graves shall hear his voice,$$),
    jsonb_build_object('verse',29,'text',$$And shall come forth; they that have done good, unto the resurrection of life; and they that have done evil, unto the resurrection of damnation.$$),
    jsonb_build_object('verse',30,'text',$$I can of mine own self do nothing: as I hear, I judge: and my judgment is just; because I seek not mine own will, but the will of the Father which hath sent me.$$),
    jsonb_build_object('verse',31,'text',$$If I bear witness of myself, my witness is not true.$$),
    jsonb_build_object('verse',32,'text',$$There is another that beareth witness of me; and I know that the witness which he witnesseth of me is true.$$),
    jsonb_build_object('verse',33,'text',$$Ye sent unto John, and he bare witness unto the truth.$$),
    jsonb_build_object('verse',34,'text',$$But I receive not testimony from man: but these things I say, that ye might be saved.$$),
    jsonb_build_object('verse',35,'text',$$He was a burning and a shining light: and ye were willing for a season to rejoice in his light.$$),
    jsonb_build_object('verse',36,'text',$$But I have greater witness than that of John: for the works which the Father hath given me to finish, the same works that I do, bear witness of me, that the Father hath sent me.$$),
    jsonb_build_object('verse',37,'text',$$And the Father himself, which hath sent me, hath borne witness of me. Ye have neither heard his voice at any time, nor seen his shape.$$),
    jsonb_build_object('verse',38,'text',$$And ye have not his word abiding in you: for whom he hath sent, him ye believe not.$$),
    jsonb_build_object('verse',39,'text',$$Search the scriptures; for in them ye think ye have eternal life: and they are they which testify of me.$$),
    jsonb_build_object('verse',40,'text',$$And ye will not come to me, that ye might have life.$$),
    jsonb_build_object('verse',41,'text',$$I receive not honour from men.$$),
    jsonb_build_object('verse',42,'text',$$But I know you, that ye have not the love of God in you.$$),
    jsonb_build_object('verse',43,'text',$$I am come in my Father's name, and ye receive me not: if another shall come in his own name, him ye will receive.$$),
    jsonb_build_object('verse',44,'text',$$How can ye believe, which receive honour one of another, and seek not the honour that cometh from God only?$$),
    jsonb_build_object('verse',45,'text',$$Do not think that I will accuse you to the Father: there is one that accuseth you, even Moses, in whom ye trust.$$),
    jsonb_build_object('verse',46,'text',$$For had ye believed Moses, ye would have believed me: for he wrote of me.$$),
    jsonb_build_object('verse',47,'text',$$But if ye believe not his writings, how shall ye believe my words?$$)
  ),
  'Public-domain KJV John 5',true,true
);

insert into public.emmaus_graph_nodes(node_key,node_type,title,subtitle,summary,scripture_reference,status,metadata)
values
('event:john-5-bethesda','event','Healing at Bethesda','Rise, take up thy bed, and walk','Jesus heals a man disabled for thirty-eight years and ignites a Sabbath controversy.','John 5:1-18','published',jsonb_build_object('book','john','chapter',5)),
('place:bethesda','place','Pool of Bethesda','Five porches in Jerusalem','The pool where a multitude waited and Jesus healed the disabled man.','John 5:2-9','published',jsonb_build_object('book','john','chapter',5)),
('person:man-at-bethesda','person','The Man at Bethesda','Healed after thirty-eight years','A disabled man whom Jesus commands to rise, carry his bed, and walk.','John 5:5-15','published',jsonb_build_object('book','john','chapter',5)),
('theme:sabbath','theme','Sabbath','Rest, mercy, and divine work','Jesus’s healing exposes conflict over Sabbath observance and reveals His unity with the Father’s work.','John 5:9-18','published',jsonb_build_object('book','john','chapter',5)),
('theme:divine-sonship','theme','Divine Sonship','The Son acts with the Father','Jesus claims unique equality, authority, honor, life-giving power, and judgment as the Son.','John 5:17-30','published',jsonb_build_object('book','john','chapter',5)),
('theme:authority-of-son','theme','Authority of the Son','Life and judgment entrusted to Jesus','The Father gives the Son authority to give life, judge, and receive equal honor.','John 5:19-30','published',jsonb_build_object('book','john','chapter',5)),
('theme:resurrection-life','theme','Resurrection and Life','The dead hear the Son’s voice','Jesus speaks of present spiritual life and future bodily resurrection.','John 5:24-29','published',jsonb_build_object('book','john','chapter',5)),
('theme:scripture-witness','theme','Scripture Bears Witness','The writings point to Christ','Jesus teaches that Scripture, including Moses, testifies about Him.','John 5:39-47','published',jsonb_build_object('book','john','chapter',5)),
('discovery:father-son-work','discovery','The Father and Son at Work','The Son does what the Father does','Jesus answers the Sabbath charge by revealing shared divine activity with the Father.','John 5:17-23','published',jsonb_build_object('book','john','chapter',5)),
('discovery:passed-death-to-life','discovery','Passed from Death to Life','Present possession of eternal life','Those who hear and believe already possess everlasting life and have crossed from death to life.','John 5:24','published',jsonb_build_object('book','john','chapter',5)),
('discovery:fourfold-witness','discovery','The Fourfold Witness','John, works, Father, and Scripture','Jesus presents multiple witnesses confirming His identity and mission.','John 5:31-47','published',jsonb_build_object('book','john','chapter',5)),
('question:john-5-wilt-whole','question','Why does Jesus ask, “Wilt thou be made whole?”','Examine desire, dependence, and response','What does the man’s answer reveal about where he expects healing to come from?','John 5:6-9','published',jsonb_build_object('book','john','chapter',5,'stage','observation')),
('question:john-5-sabbath','question','Why does the healing create conflict?','Compare mercy and regulation','What does the Sabbath dispute reveal about Jesus’s identity and the leaders’ priorities?','John 5:9-18','published',jsonb_build_object('book','john','chapter',5,'stage','interpretation')),
('question:john-5-equal','question','What does Jesus claim about His relationship with the Father?','Trace actions, honor, life, and judgment','List everything the Son does in verses 19-30 that belongs to God’s authority.','John 5:19-30','published',jsonb_build_object('book','john','chapter',5,'stage','connection')),
('question:john-5-witnesses','question','Which witnesses testify about Jesus?','Follow the evidence','How do John, Jesus’s works, the Father, Scripture, and Moses converge in their testimony?','John 5:31-47','published',jsonb_build_object('book','john','chapter',5,'stage','interpretation')),
('question:john-5-search-scriptures','question','Can someone search Scripture and still miss Jesus?','Examine knowledge without surrender','What keeps the leaders from coming to Jesus even though they study the writings that testify about Him?','John 5:39-47','published',jsonb_build_object('book','john','chapter',5,'stage','application'))
on conflict(node_key) do update set
 node_type=excluded.node_type,title=excluded.title,subtitle=excluded.subtitle,
 summary=excluded.summary,scripture_reference=excluded.scripture_reference,status='published',
 metadata=public.emmaus_graph_nodes.metadata||excluded.metadata,updated_at=now();

insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,weight,explanation,status,metadata)
select v.id,t.id,m.relationship_key,m.weight,m.explanation,'published',jsonb_build_object('seed','kjv-john-5')
from (values
 (1,18,'event:john-5-bethesda','features_event',1.6,'The opening section narrates the healing at Bethesda and its controversy.'),
 (2,9,'place:bethesda','occurs_at',1.4,'The healing occurs at the pool called Bethesda.'),
 (5,15,'person:man-at-bethesda','features_person',1.4,'The man healed after thirty-eight years stands at the center of the sign.'),
 (5,9,'event:john-sign-3-bethesda','features_event',1.7,'This healing is the third major sign in John’s sequence.'),
 (6,9,'question:john-5-wilt-whole','recommended_next',1.4,'Jesus’s question invites reflection on the man’s expectations and response.'),
 (9,18,'theme:sabbath','develops_theme',1.6,'The healing becomes a dispute over Sabbath authority and divine work.'),
 (9,18,'question:john-5-sabbath','recommended_next',1.4,'The controversy reveals both Jesus’s identity and the leaders’ priorities.'),
 (17,23,'discovery:father-son-work','develops_theme',1.8,'Jesus reveals shared divine work between Father and Son.'),
 (17,30,'theme:divine-sonship','develops_theme',1.8,'Jesus describes His unique relationship with the Father.'),
 (19,30,'theme:authority-of-son','develops_theme',1.8,'The Son gives life, judges, and receives equal honor.'),
 (19,30,'question:john-5-equal','recommended_next',1.5,'The learner is invited to catalogue Jesus’s divine claims.'),
 (21,29,'theme:resurrection-life','develops_theme',1.7,'Jesus claims authority over present life and future resurrection.'),
 (24,24,'discovery:passed-death-to-life','develops_theme',1.8,'Believers already possess life and have crossed out of condemnation.'),
 (24,29,'theme:eternal-life','develops_theme',1.7,'Hearing and believing the Son leads to everlasting life.'),
 (22,30,'theme:judgment','develops_theme',1.6,'The Father entrusts judgment to the Son.'),
 (31,47,'discovery:fourfold-witness','develops_theme',1.8,'Jesus presents converging testimony to His identity.'),
 (31,47,'theme:witness','develops_theme',1.6,'The discourse develops multiple witnesses concerning Jesus.'),
 (33,35,'person:john-the-baptist','features_person',1.4,'John is named as a burning and shining witness.'),
 (36,36,'theme:signs-and-belief','develops_theme',1.5,'Jesus’s works bear witness that the Father sent Him.'),
 (37,38,'person:jesus','reveals_attribute',1.3,'Jesus describes the Father’s direct witness to Him.'),
 (39,47,'theme:scripture-witness','develops_theme',1.8,'Scripture and Moses testify about Jesus.'),
 (31,47,'question:john-5-witnesses','recommended_next',1.5,'The witnesses can be compared as a cumulative case.'),
 (39,47,'question:john-5-search-scriptures','recommended_next',1.5,'The passage warns that biblical study without coming to Christ can remain lifeless.'),
 (39,40,'theme:life','develops_theme',1.6,'The Scriptures testify about Jesus, yet life is found by coming to Him.'),
 (41,44,'theme:glory','develops_theme',1.4,'Seeking human honor obstructs faith in the honor that comes from God.'),
 (45,47,'passage:genesis-1-1-5','alludes_to',0.8,'Moses’s writings form part of the scriptural witness that ultimately points to Christ.')
) as m(verse_start,verse_end,target_key,relationship_key,weight,explanation)
join generate_series(m.verse_start,m.verse_end) n on true
join public.emmaus_graph_nodes v on v.node_key='scripture:kjv:john-5-'||n
join public.emmaus_graph_nodes t on t.node_key=m.target_key
on conflict(source_node_id,target_node_id,relationship_key) do update set
 weight=excluded.weight,explanation=excluded.explanation,status='published',
 metadata=public.emmaus_graph_edges.metadata||excluded.metadata,updated_at=now();
