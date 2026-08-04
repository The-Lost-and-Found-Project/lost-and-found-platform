-- John 4 is the first chapter imported through import_emmaus_scripture_chapter.

select public.import_emmaus_scripture_chapter(
  'KJV','john',4,
  jsonb_build_array(
    jsonb_build_object('verse',1,'text',$$When therefore the Lord knew how the Pharisees had heard that Jesus made and baptized more disciples than John,$$),
    jsonb_build_object('verse',2,'text',$$(Though Jesus himself baptized not, but his disciples,)$$),
    jsonb_build_object('verse',3,'text',$$He left Judaea, and departed again into Galilee.$$),
    jsonb_build_object('verse',4,'text',$$And he must needs go through Samaria.$$),
    jsonb_build_object('verse',5,'text',$$Then cometh he to a city of Samaria, which is called Sychar, near to the parcel of ground that Jacob gave to his son Joseph.$$),
    jsonb_build_object('verse',6,'text',$$Now Jacob's well was there. Jesus therefore, being wearied with his journey, sat thus on the well: and it was about the sixth hour.$$),
    jsonb_build_object('verse',7,'text',$$There cometh a woman of Samaria to draw water: Jesus saith unto her, Give me to drink.$$),
    jsonb_build_object('verse',8,'text',$$(For his disciples were gone away unto the city to buy meat.)$$),
    jsonb_build_object('verse',9,'text',$$Then saith the woman of Samaria unto him, How is it that thou, being a Jew, askest drink of me, which am a woman of Samaria? for the Jews have no dealings with the Samaritans.$$),
    jsonb_build_object('verse',10,'text',$$Jesus answered and said unto her, If thou knewest the gift of God, and who it is that saith to thee, Give me to drink; thou wouldest have asked of him, and he would have given thee living water.$$),
    jsonb_build_object('verse',11,'text',$$The woman saith unto him, Sir, thou hast nothing to draw with, and the well is deep: from whence then hast thou that living water?$$),
    jsonb_build_object('verse',12,'text',$$Art thou greater than our father Jacob, which gave us the well, and drank thereof himself, and his children, and his cattle?$$),
    jsonb_build_object('verse',13,'text',$$Jesus answered and said unto her, Whosoever drinketh of this water shall thirst again:$$),
    jsonb_build_object('verse',14,'text',$$But whosoever drinketh of the water that I shall give him shall never thirst; but the water that I shall give him shall be in him a well of water springing up into everlasting life.$$),
    jsonb_build_object('verse',15,'text',$$The woman saith unto him, Sir, give me this water, that I thirst not, neither come hither to draw.$$),
    jsonb_build_object('verse',16,'text',$$Jesus saith unto her, Go, call thy husband, and come hither.$$),
    jsonb_build_object('verse',17,'text',$$The woman answered and said, I have no husband. Jesus said unto her, Thou hast well said, I have no husband:$$),
    jsonb_build_object('verse',18,'text',$$For thou hast had five husbands; and he whom thou now hast is not thy husband: in that saidst thou truly.$$),
    jsonb_build_object('verse',19,'text',$$The woman saith unto him, Sir, I perceive that thou art a prophet.$$),
    jsonb_build_object('verse',20,'text',$$Our fathers worshipped in this mountain; and ye say, that in Jerusalem is the place where men ought to worship.$$),
    jsonb_build_object('verse',21,'text',$$Jesus saith unto her, Woman, believe me, the hour cometh, when ye shall neither in this mountain, nor yet at Jerusalem, worship the Father.$$),
    jsonb_build_object('verse',22,'text',$$Ye worship ye know not what: we know what we worship: for salvation is of the Jews.$$),
    jsonb_build_object('verse',23,'text',$$But the hour cometh, and now is, when the true worshippers shall worship the Father in spirit and in truth: for the Father seeketh such to worship him.$$),
    jsonb_build_object('verse',24,'text',$$God is a Spirit: and they that worship him must worship him in spirit and in truth.$$),
    jsonb_build_object('verse',25,'text',$$The woman saith unto him, I know that Messias cometh, which is called Christ: when he is come, he will tell us all things.$$),
    jsonb_build_object('verse',26,'text',$$Jesus saith unto her, I that speak unto thee am he.$$),
    jsonb_build_object('verse',27,'text',$$And upon this came his disciples, and marvelled that he talked with the woman: yet no man said, What seekest thou? or, Why talkest thou with her?$$),
    jsonb_build_object('verse',28,'text',$$The woman then left her waterpot, and went her way into the city, and saith to the men,$$),
    jsonb_build_object('verse',29,'text',$$Come, see a man, which told me all things that ever I did: is not this the Christ?$$),
    jsonb_build_object('verse',30,'text',$$Then they went out of the city, and came unto him.$$),
    jsonb_build_object('verse',31,'text',$$In the mean while his disciples prayed him, saying, Master, eat.$$),
    jsonb_build_object('verse',32,'text',$$But he said unto them, I have meat to eat that ye know not of.$$),
    jsonb_build_object('verse',33,'text',$$Therefore said the disciples one to another, Hath any man brought him ought to eat?$$),
    jsonb_build_object('verse',34,'text',$$Jesus saith unto them, My meat is to do the will of him that sent me, and to finish his work.$$),
    jsonb_build_object('verse',35,'text',$$Say not ye, There are yet four months, and then cometh harvest? behold, I say unto you, Lift up your eyes, and look on the fields; for they are white already to harvest.$$),
    jsonb_build_object('verse',36,'text',$$And he that reapeth receiveth wages, and gathereth fruit unto life eternal: that both he that soweth and he that reapeth may rejoice together.$$),
    jsonb_build_object('verse',37,'text',$$And herein is that saying true, One soweth, and another reapeth.$$),
    jsonb_build_object('verse',38,'text',$$I sent you to reap that whereon ye bestowed no labour: other men laboured, and ye are entered into their labours.$$),
    jsonb_build_object('verse',39,'text',$$And many of the Samaritans of that city believed on him for the saying of the woman, which testified, He told me all that ever I did.$$),
    jsonb_build_object('verse',40,'text',$$So when the Samaritans were come unto him, they besought him that he would tarry with them: and he abode there two days.$$),
    jsonb_build_object('verse',41,'text',$$And many more believed because of his own word;$$),
    jsonb_build_object('verse',42,'text',$$And said unto the woman, Now we believe, not because of thy saying: for we have heard him ourselves, and know that this is indeed the Christ, the Saviour of the world.$$),
    jsonb_build_object('verse',43,'text',$$Now after two days he departed thence, and went into Galilee.$$),
    jsonb_build_object('verse',44,'text',$$For Jesus himself testified, that a prophet hath no honour in his own country.$$),
    jsonb_build_object('verse',45,'text',$$Then when he was come into Galilee, the Galilaeans received him, having seen all the things that he did at Jerusalem at the feast: for they also went unto the feast.$$),
    jsonb_build_object('verse',46,'text',$$So Jesus came again into Cana of Galilee, where he made the water wine. And there was a certain nobleman, whose son was sick at Capernaum.$$),
    jsonb_build_object('verse',47,'text',$$When he heard that Jesus was come out of Judaea into Galilee, he went unto him, and besought him that he would come down, and heal his son: for he was at the point of death.$$),
    jsonb_build_object('verse',48,'text',$$Then said Jesus unto him, Except ye see signs and wonders, ye will not believe.$$),
    jsonb_build_object('verse',49,'text',$$The nobleman saith unto him, Sir, come down ere my child die.$$),
    jsonb_build_object('verse',50,'text',$$Jesus saith unto him, Go thy way; thy son liveth. And the man believed the word that Jesus had spoken unto him, and he went his way.$$),
    jsonb_build_object('verse',51,'text',$$And as he was now going down, his servants met him, and told him, saying, Thy son liveth.$$),
    jsonb_build_object('verse',52,'text',$$Then enquired he of them the hour when he began to amend. And they said unto him, Yesterday at the seventh hour the fever left him.$$),
    jsonb_build_object('verse',53,'text',$$So the father knew that it was at the same hour, in the which Jesus said unto him, Thy son liveth: and himself believed, and his whole house.$$),
    jsonb_build_object('verse',54,'text',$$This is again the second miracle that Jesus did, when he was come out of Judaea into Galilee.$$)
  ),
  'Public-domain KJV John 4; verified against Project Gutenberg and Bible Gateway',true,true
);

insert into public.emmaus_graph_nodes(node_key,node_type,title,subtitle,summary,scripture_reference,status,metadata)
values
('event:john-4-samaritan-woman','event','Jesus and the Samaritan Woman','A boundary-crossing conversation','Jesus meets a Samaritan woman at Jacob’s well and reveals Himself as Messiah.','John 4:4-42','published',jsonb_build_object('book','john','chapter',4)),
('event:john-4-official-son','event','Healing the Official’s Son','The second sign in Galilee','Jesus heals a royal official’s son from a distance, and the household believes.','John 4:46-54','published',jsonb_build_object('book','john','chapter',4)),
('place:sychar','place','Sychar','Samaritan town near Jacob’s well','The Samaritan woman’s city and the setting for many Samaritans coming to faith.','John 4:5,28-42','published',jsonb_build_object('book','john','chapter',4)),
('place:jacobs-well','place','Jacob’s Well','Meeting place in Samaria','Jesus sits at Jacob’s well and offers living water.','John 4:6-15','published',jsonb_build_object('book','john','chapter',4)),
('theme:living-water','theme','Living Water','Life supplied by Christ','Jesus promises water that becomes an inner spring unto everlasting life.','John 4:10-14','published',jsonb_build_object('book','john','chapter',4)),
('theme:true-worship','theme','True Worship','Worship in spirit and truth','Jesus relocates true worship from competing sacred sites to Spirit-and-truth worship of the Father.','John 4:20-24','published',jsonb_build_object('book','john','chapter',4)),
('theme:harvest','theme','Harvest','Sowing, reaping, and mission','Jesus teaches His disciples to recognize fields already ready for spiritual harvest.','John 4:34-38','published',jsonb_build_object('book','john','chapter',4)),
('theme:saviour-of-world','theme','Saviour of the World','Messiah beyond one people','The Samaritans confess Jesus as the Christ and Saviour of the world.','John 4:42','published',jsonb_build_object('book','john','chapter',4)),
('discovery:living-water','discovery','The Gift of Living Water','From physical thirst to eternal life','Jesus leads the woman from thinking about well water to recognizing His gift of eternal life.','John 4:7-15','published',jsonb_build_object('book','john','chapter',4)),
('discovery:worship-spirit-truth','discovery','Worship in Spirit and Truth','The Father seeks worshippers','Jesus reveals the nature of worship suitable to God’s own being.','John 4:20-24','published',jsonb_build_object('book','john','chapter',4)),
('discovery:come-see-witness','discovery','Come, See a Man','Personal encounter becomes witness','The Samaritan woman turns from questioned outsider into a witness who brings her city to Jesus.','John 4:28-42','published',jsonb_build_object('book','john','chapter',4)),
('question:john-4-living-water','question','What kind of water is Jesus offering?','Trace the misunderstanding','How does Jesus move the conversation from physical water to everlasting life?','John 4:7-15','published',jsonb_build_object('book','john','chapter',4,'stage','interpretation')),
('question:john-4-worship','question','What makes worship true?','Compare place, Spirit, and truth','Why does Jesus move the question away from Mount Gerizim and Jerusalem?','John 4:19-24','published',jsonb_build_object('book','john','chapter',4,'stage','connection')),
('question:john-4-witness','question','What changed the woman into a witness?','Observe her movement through the story','Which details show her understanding of Jesus growing during the conversation?','John 4:7-30','published',jsonb_build_object('book','john','chapter',4,'stage','observation')),
('question:john-4-believing-word','question','What does it mean to believe Jesus’s word?','Compare signs and trust','How does the official respond before he sees evidence that his son is healed?','John 4:46-54','published',jsonb_build_object('book','john','chapter',4,'stage','application'))
on conflict(node_key) do update set
  node_type=excluded.node_type,title=excluded.title,subtitle=excluded.subtitle,
  summary=excluded.summary,scripture_reference=excluded.scripture_reference,status='published',
  metadata=public.emmaus_graph_nodes.metadata||excluded.metadata,updated_at=now();

insert into public.emmaus_graph_edges(source_node_id,target_node_id,relationship_key,weight,explanation,status,metadata)
select v.id,t.id,m.relationship_key,m.weight,m.explanation,'published',jsonb_build_object('seed','kjv-john-4')
from (values
 (4,42,'event:john-4-samaritan-woman','features_event',1.5,'This section narrates Jesus’s encounter with the Samaritan woman and the response of her city.'),
 (5,42,'place:sychar','occurs_at',1.3,'The encounter and resulting Samaritan response center on Sychar.'),
 (6,15,'place:jacobs-well','occurs_at',1.3,'The conversation begins at Jacob’s well.'),
 (7,42,'person:samaritan-woman','features_person',1.5,'The Samaritan woman moves from misunderstanding to witness.'),
 (10,14,'theme:living-water','develops_theme',1.7,'Jesus offers living water that becomes a spring unto everlasting life.'),
 (10,15,'discovery:living-water','develops_theme',1.7,'The dialogue develops the gift of living water.'),
 (7,15,'question:john-4-living-water','recommended_next',1.4,'The physical-spiritual misunderstanding invites deeper observation.'),
 (19,24,'theme:true-worship','develops_theme',1.7,'Jesus defines true worship in relation to the Father, Spirit, and truth.'),
 (20,24,'discovery:worship-spirit-truth','develops_theme',1.7,'This section develops worship in Spirit and truth.'),
 (19,24,'question:john-4-worship','recommended_next',1.4,'The dialogue redirects worship from location to reality.'),
 (25,26,'theme:belief','develops_theme',1.5,'Jesus directly identifies Himself to the woman as Messiah.'),
 (28,42,'discovery:come-see-witness','develops_theme',1.7,'The woman’s invitation leads others toward personal encounter with Jesus.'),
 (28,42,'theme:witness','develops_theme',1.6,'Her testimony becomes the first step toward wider Samaritan belief.'),
 (7,30,'question:john-4-witness','recommended_next',1.4,'The learner can trace the woman’s developing understanding.'),
 (34,38,'theme:harvest','develops_theme',1.7,'Jesus interprets mission through sowing and reaping imagery.'),
 (39,42,'theme:belief','develops_theme',1.6,'The Samaritans move from believing the woman’s word to believing Jesus Himself.'),
 (42,42,'theme:saviour-of-world','develops_theme',1.8,'The chapter reaches a universal confession of Jesus as Saviour of the world.'),
 (46,54,'event:john-4-official-son','features_event',1.6,'The closing section narrates the healing of the official’s son.'),
 (46,54,'event:john-sign-2-official-son','features_event',1.7,'John identifies this healing as the second sign in Galilee.'),
 (46,46,'place:cana','occurs_at',1.3,'Jesus returns to Cana, where the first sign occurred.'),
 (46,53,'place:capernaum','occurs_at',1.3,'The official’s son is sick in Capernaum.'),
 (48,54,'theme:signs-and-belief','develops_theme',1.6,'The account contrasts dependence on signs with believing Jesus’s word.'),
 (50,53,'question:john-4-believing-word','recommended_next',1.5,'The official trusts Jesus before receiving confirmation.'),
 (50,53,'theme:belief','develops_theme',1.6,'The man believes Jesus’s word, then his whole household believes.')
) as m(verse_start,verse_end,target_key,relationship_key,weight,explanation)
join generate_series(m.verse_start,m.verse_end) n on true
join public.emmaus_graph_nodes v on v.node_key='scripture:kjv:john-4-'||n
join public.emmaus_graph_nodes t on t.node_key=m.target_key
on conflict(source_node_id,target_node_id,relationship_key) do update set
 weight=excluded.weight,explanation=excluded.explanation,status='published',
 metadata=public.emmaus_graph_edges.metadata||excluded.metadata,updated_at=now();
