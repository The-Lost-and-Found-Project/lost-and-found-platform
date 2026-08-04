create or replace function public.upsert_emmaus_graph_node(
  p_node_key text,
  p_node_type text,
  p_title text,
  p_subtitle text,
  p_summary text,
  p_scripture_reference text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  result_id uuid;
begin
  if not public.is_emmaus_admin() then raise exception 'Not authorized'; end if;

  insert into public.emmaus_graph_nodes (
    node_key,node_type,title,subtitle,summary,scripture_reference,status,metadata
  ) values (
    p_node_key,p_node_type,p_title,p_subtitle,p_summary,p_scripture_reference,'published',coalesce(p_metadata,'{}'::jsonb)
  )
  on conflict (node_key) do update set
    node_type=excluded.node_type,
    title=excluded.title,
    subtitle=excluded.subtitle,
    summary=excluded.summary,
    scripture_reference=excluded.scripture_reference,
    status='published',
    metadata=public.emmaus_graph_nodes.metadata || excluded.metadata,
    updated_at=now()
  returning id into result_id;

  return result_id;
end;
$$;

grant execute on function public.upsert_emmaus_graph_node(text,text,text,text,text,text,jsonb) to authenticated;

create or replace function public.upsert_emmaus_graph_edge(
  p_source_key text,
  p_target_key text,
  p_relationship_key text,
  p_explanation text,
  p_weight numeric default 1.0,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_id uuid;
  target_id uuid;
  result_id uuid;
begin
  if not public.is_emmaus_admin() then raise exception 'Not authorized'; end if;
  select id into source_id from public.emmaus_graph_nodes where node_key=p_source_key;
  select id into target_id from public.emmaus_graph_nodes where node_key=p_target_key;
  if source_id is null or target_id is null then raise exception 'Missing source or target graph node'; end if;

  insert into public.emmaus_graph_edges (
    source_node_id,target_node_id,relationship_key,weight,explanation,status,metadata
  ) values (
    source_id,target_id,p_relationship_key,p_weight,p_explanation,'published',coalesce(p_metadata,'{}'::jsonb)
  )
  on conflict (source_node_id,target_node_id,relationship_key) do update set
    weight=excluded.weight,
    explanation=excluded.explanation,
    status='published',
    metadata=public.emmaus_graph_edges.metadata || excluded.metadata,
    updated_at=now()
  returning id into result_id;

  return result_id;
end;
$$;

grant execute on function public.upsert_emmaus_graph_edge(text,text,text,text,numeric,jsonb) to authenticated;

-- Core people
select public.upsert_emmaus_graph_node('person:jesus','person','Jesus Christ','The Word made flesh','The central person of John, revealed as the eternal Word, Son of God, Messiah, Lamb, Shepherd, King, and risen Lord.','John 1:1-18',jsonb_build_object('book','john','importance','central'));
select public.upsert_emmaus_graph_node('person:john-the-baptist','person','John the Baptist','Witness to the Light','The forerunner who identifies Jesus as the Lamb of God and bears witness to His identity.','John 1:6-36',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('person:nicodemus','person','Nicodemus','Teacher of Israel','A Pharisee who comes to Jesus by night and hears the teaching on new birth.','John 3:1-21',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('person:samaritan-woman','person','The Samaritan Woman','Witness in Samaria','A woman who encounters Jesus at Jacob’s well and becomes a witness to her town.','John 4:1-42',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('person:lazarus','person','Lazarus','Raised from the dead','The brother of Mary and Martha whom Jesus calls from the tomb.','John 11:1-44',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('person:mary-of-bethany','person','Mary of Bethany','Devoted disciple','The sister of Martha and Lazarus who anoints Jesus.','John 11:1-12:8',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('person:martha','person','Martha','Confessor of faith','Lazarus’s sister who confesses Jesus as the Christ and Son of God.','John 11:17-27',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('person:peter','person','Simon Peter','Disciple restored','A leading disciple who confesses loyalty, denies Jesus, and is restored.','John 1:40-42; 13:36-38; 18:15-27; 21:15-19',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('person:thomas','person','Thomas','From doubt to worship','A disciple whose encounter with the risen Jesus leads to the confession, My Lord and my God.','John 20:24-29',jsonb_build_object('book','john'));

-- Core places
select public.upsert_emmaus_graph_node('place:cana','place','Cana of Galilee','Site of the first sign','The Galilean town where Jesus turned water into wine.','John 2:1-11',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('place:jerusalem','place','Jerusalem','Festival and conflict center','The city where major signs, discourses, opposition, crucifixion, and resurrection events occur.','John 2-20',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('place:samaria','place','Samaria','Field ready for harvest','The region where Jesus meets the Samaritan woman and many believe.','John 4:1-42',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('place:bethany','place','Bethany','Home of Mary, Martha, and Lazarus','The village associated with Lazarus’s resurrection and Mary’s anointing.','John 11:1-12:8',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('place:golgotha','place','Golgotha','Place of crucifixion','The place where Jesus is crucified.','John 19:17-37',jsonb_build_object('book','john'));

-- Major themes
select public.upsert_emmaus_graph_node('theme:belief','theme','Belief','John’s stated purpose','Trusting Jesus as the Christ and Son of God is the central response invited by the Gospel.','John 20:30-31',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('theme:life','theme','Life','Life in the Son','Life is found in Jesus, beginning now and extending eternally.','John 1:4; 3:16; 5:24; 10:10; 20:31',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('theme:light','theme','Light','The Light shines in darkness','Jesus reveals God and exposes the moral and spiritual condition of humanity.','John 1:4-9; 3:19-21; 8:12; 9:5',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('theme:witness','theme','Witness','Testimony concerning Jesus','John presents multiple witnesses who testify to Jesus’s identity.','John 1:6-8; 5:31-39; 15:26-27',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('theme:glory','theme','Glory','The glory of the Son','Jesus’s signs, cross, resurrection, and unity with the Father reveal divine glory.','John 1:14; 2:11; 11:4; 12:23-28; 17:1-5',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('theme:love','theme','Love','Divine and discipling love','God’s love is revealed in sending the Son and becomes the defining mark of Jesus’s disciples.','John 3:16; 13:34-35; 15:9-17',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('theme:truth','theme','Truth','Reality revealed in Christ','Truth is embodied and revealed by Jesus and received through His word and Spirit.','John 1:14-17; 8:31-32; 14:6; 16:13',jsonb_build_object('book','john'));
select public.upsert_emmaus_graph_node('theme:spirit','theme','The Holy Spirit','New birth and abiding presence','The Spirit gives new birth, life, truth, remembrance, and witness.','John 3:5-8; 7:37-39; 14:16-17; 16:7-15',jsonb_build_object('book','john'));

-- Seven signs as event nodes
select public.upsert_emmaus_graph_node('event:john-sign-1-water-to-wine','event','Water Turned to Wine','The first sign','Jesus transforms water into wine, revealing His glory.','John 2:1-11',jsonb_build_object('book','john','sign_number',1));
select public.upsert_emmaus_graph_node('event:john-sign-2-official-son','event','Healing the Official’s Son','The second sign','Jesus heals a royal official’s son at a distance.','John 4:46-54',jsonb_build_object('book','john','sign_number',2));
select public.upsert_emmaus_graph_node('event:john-sign-3-bethesda','event','Healing at Bethesda','The third sign','Jesus heals a man who had been unable to walk for many years.','John 5:1-18',jsonb_build_object('book','john','sign_number',3));
select public.upsert_emmaus_graph_node('event:john-sign-4-feeding-five-thousand','event','Feeding the Five Thousand','The fourth sign','Jesus multiplies bread and fish for a multitude.','John 6:1-15',jsonb_build_object('book','john','sign_number',4));
select public.upsert_emmaus_graph_node('event:john-sign-5-walking-on-water','event','Walking on Water','The fifth sign','Jesus walks across the sea to His disciples.','John 6:16-21',jsonb_build_object('book','john','sign_number',5));
select public.upsert_emmaus_graph_node('event:john-sign-6-man-born-blind','event','Healing the Man Born Blind','The sixth sign','Jesus gives sight to a man blind from birth.','John 9:1-41',jsonb_build_object('book','john','sign_number',6));
select public.upsert_emmaus_graph_node('event:john-sign-7-raising-lazarus','event','Raising Lazarus','The seventh sign','Jesus raises Lazarus after four days in the tomb.','John 11:1-44',jsonb_build_object('book','john','sign_number',7));

-- Seven I AM statement discoveries
select public.upsert_emmaus_graph_node('discovery:i-am-bread-of-life','discovery','I Am the Bread of Life','First I AM statement','Jesus identifies Himself as the true bread who gives eternal life.','John 6:35',jsonb_build_object('book','john','i_am_number',1));
select public.upsert_emmaus_graph_node('discovery:i-am-light-of-world','discovery','I Am the Light of the World','Second I AM statement','Jesus promises the light of life to those who follow Him.','John 8:12',jsonb_build_object('book','john','i_am_number',2));
select public.upsert_emmaus_graph_node('discovery:i-am-door','discovery','I Am the Door','Third I AM statement','Jesus presents Himself as the entrance to salvation and safe pasture.','John 10:7-9',jsonb_build_object('book','john','i_am_number',3));
select public.upsert_emmaus_graph_node('discovery:i-am-good-shepherd','discovery','I Am the Good Shepherd','Fourth I AM statement','Jesus lays down His life for the sheep and knows them personally.','John 10:11-18',jsonb_build_object('book','john','i_am_number',4));
select public.upsert_emmaus_graph_node('discovery:i-am-resurrection-life','discovery','I Am the Resurrection and the Life','Fifth I AM statement','Jesus identifies Himself as the source of resurrection and life.','John 11:25-26',jsonb_build_object('book','john','i_am_number',5));
select public.upsert_emmaus_graph_node('discovery:i-am-way-truth-life','discovery','I Am the Way, the Truth, and the Life','Sixth I AM statement','Jesus declares Himself the exclusive way to the Father.','John 14:6',jsonb_build_object('book','john','i_am_number',6));
select public.upsert_emmaus_graph_node('discovery:i-am-true-vine','discovery','I Am the True Vine','Seventh I AM statement','Jesus teaches that fruitful life depends on abiding in Him.','John 15:1-8',jsonb_build_object('book','john','i_am_number',7));

-- Book membership and chapter associations
select public.upsert_emmaus_graph_edge(node_key,'bible-book:john','part_of',title||' belongs to the Gospel of John.',1.0,jsonb_build_object('seed','john-semantic-v1'))
from public.emmaus_graph_nodes
where metadata->>'book'='john' and node_key<>'bible-book:john';

select public.upsert_emmaus_graph_edge('event:john-sign-1-water-to-wine','place:cana','occurs_at','The first sign takes place at a wedding in Cana.',1.2,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('event:john-sign-1-water-to-wine','theme:glory','develops_theme','The sign manifests Jesus’s glory and leads His disciples to believe.',1.4,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('event:john-sign-2-official-son','theme:belief','develops_theme','The official believes Jesus’s word before seeing the result.',1.3,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('event:john-sign-4-feeding-five-thousand','discovery:i-am-bread-of-life','recommended_next','The feeding sign prepares the learner for the Bread of Life discourse.',1.5,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('event:john-sign-6-man-born-blind','discovery:i-am-light-of-world','develops_theme','The healing sign embodies Jesus’s claim to be the Light of the World.',1.5,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('event:john-sign-7-raising-lazarus','discovery:i-am-resurrection-life','recommended_next','The raising of Lazarus demonstrates Jesus’s authority as the Resurrection and the Life.',1.6,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('event:john-sign-7-raising-lazarus','person:lazarus','features_person','Lazarus is the person raised in the seventh sign.',1.3,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('event:john-sign-7-raising-lazarus','place:bethany','occurs_at','The raising of Lazarus occurs at Bethany.',1.2,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('person:nicodemus','theme:life','develops_theme','Jesus teaches Nicodemus about new birth and eternal life.',1.2,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('person:nicodemus','theme:light','develops_theme','The conversation moves into the contrast between light and darkness.',1.2,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('person:samaritan-woman','theme:witness','develops_theme','The Samaritan woman becomes a witness who invites others to meet Jesus.',1.3,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('person:samaritan-woman','place:samaria','occurs_at','Her encounter with Jesus occurs in Samaria.',1.1,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('person:john-the-baptist','theme:witness','develops_theme','John’s primary role in the Gospel is to bear witness to Jesus.',1.4,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('person:thomas','theme:belief','develops_theme','Thomas moves from doubt to the Gospel’s climactic confession of faith.',1.4,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:i-am-light-of-world','theme:light','develops_theme','Jesus’s I AM statement defines Him as the source of spiritual light.',1.5,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:i-am-resurrection-life','theme:life','develops_theme','Jesus identifies life and resurrection as realities centered in Himself.',1.5,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:i-am-way-truth-life','theme:truth','develops_theme','Jesus embodies and reveals truth rather than merely teaching information.',1.5,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:i-am-true-vine','theme:life','develops_theme','Abiding in Jesus is presented as the source of fruitful life.',1.4,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('theme:love','person:jesus','reveals_attribute','Jesus reveals divine love through His mission, commands, and self-giving death.',1.5,'{"seed":"john-semantic-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('theme:glory','person:jesus','reveals_attribute','The glory of God is revealed in Jesus’s signs, cross, resurrection, and return to the Father.',1.5,'{"seed":"john-semantic-v1"}'::jsonb);

-- Ordered learning routes
select public.upsert_emmaus_graph_edge('event:john-sign-1-water-to-wine','event:john-sign-2-official-son','recommended_next','Continue through John’s ordered sequence of signs.',1.0,'{"route":"seven-signs"}'::jsonb);
select public.upsert_emmaus_graph_edge('event:john-sign-2-official-son','event:john-sign-3-bethesda','recommended_next','Continue through John’s ordered sequence of signs.',1.0,'{"route":"seven-signs"}'::jsonb);
select public.upsert_emmaus_graph_edge('event:john-sign-3-bethesda','event:john-sign-4-feeding-five-thousand','recommended_next','Continue through John’s ordered sequence of signs.',1.0,'{"route":"seven-signs"}'::jsonb);
select public.upsert_emmaus_graph_edge('event:john-sign-4-feeding-five-thousand','event:john-sign-5-walking-on-water','recommended_next','Continue through John’s ordered sequence of signs.',1.0,'{"route":"seven-signs"}'::jsonb);
select public.upsert_emmaus_graph_edge('event:john-sign-5-walking-on-water','event:john-sign-6-man-born-blind','recommended_next','Continue through John’s ordered sequence of signs.',1.0,'{"route":"seven-signs"}'::jsonb);
select public.upsert_emmaus_graph_edge('event:john-sign-6-man-born-blind','event:john-sign-7-raising-lazarus','recommended_next','Continue through John’s ordered sequence of signs.',1.0,'{"route":"seven-signs"}'::jsonb);

select public.upsert_emmaus_graph_edge('discovery:i-am-bread-of-life','discovery:i-am-light-of-world','recommended_next','Continue through the seven I AM statements.',1.0,'{"route":"seven-i-am"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:i-am-light-of-world','discovery:i-am-door','recommended_next','Continue through the seven I AM statements.',1.0,'{"route":"seven-i-am"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:i-am-door','discovery:i-am-good-shepherd','recommended_next','Continue through the seven I AM statements.',1.0,'{"route":"seven-i-am"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:i-am-good-shepherd','discovery:i-am-resurrection-life','recommended_next','Continue through the seven I AM statements.',1.0,'{"route":"seven-i-am"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:i-am-resurrection-life','discovery:i-am-way-truth-life','recommended_next','Continue through the seven I AM statements.',1.0,'{"route":"seven-i-am"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:i-am-way-truth-life','discovery:i-am-true-vine','recommended_next','Continue through the seven I AM statements.',1.0,'{"route":"seven-i-am"}'::jsonb);
