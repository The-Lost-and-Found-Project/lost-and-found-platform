-- John 1 exploration layer: semantic nodes, questions, OT echoes, language terms,
-- and verse-aware links that activate whenever KJV verse nodes exist.

select public.upsert_emmaus_graph_node('theme:creation','theme','Creation','All things made through the Word','John presents the Word as active in creation and echoes the opening of Genesis.','John 1:1-3',jsonb_build_object('book','john','chapter',1));
select public.upsert_emmaus_graph_node('theme:incarnation','theme','Incarnation','The Word became flesh','The eternal Word enters human history and dwells among humanity.','John 1:14',jsonb_build_object('book','john','chapter',1));
select public.upsert_emmaus_graph_node('theme:grace','theme','Grace','Grace and truth through Jesus Christ','John contrasts the giving of the law through Moses with grace and truth coming through Jesus Christ.','John 1:14-17',jsonb_build_object('book','john','chapter',1));
select public.upsert_emmaus_graph_node('theme:new-identity','theme','New Identity','Children of God','Those who receive and believe in Christ are given authority to become children of God.','John 1:12-13',jsonb_build_object('book','john','chapter',1));

select public.upsert_emmaus_graph_node('language:logos','language_term','Logos','Greek: λόγος','A rich Greek term translated Word, carrying ideas of speech, reason, revelation, and self-expression.','John 1:1',jsonb_build_object('language','Greek','lemma','λόγος','transliteration','logos','book','john','chapter',1));
select public.upsert_emmaus_graph_node('language:monogenes','language_term','Monogenēs','Greek: μονογενής','A Greek term describing Jesus as unique, one-of-a-kind, or only begotten in relation to the Father.','John 1:14,18',jsonb_build_object('language','Greek','lemma','μονογενής','transliteration','monogenes','book','john','chapter',1));
select public.upsert_emmaus_graph_node('language:eskēnōsen','language_term','Eskēnōsen','Greek: ἐσκήνωσεν','A verb meaning dwelt or tabernacled, evoking God’s presence among His people.','John 1:14',jsonb_build_object('language','Greek','lemma','ἐσκήνωσεν','transliteration','eskenosen','book','john','chapter',1));

select public.upsert_emmaus_graph_node('person:andrew','person','Andrew','First disciple and witness','Andrew follows Jesus and brings his brother Simon Peter to Him.','John 1:35-42',jsonb_build_object('book','john','chapter',1));
select public.upsert_emmaus_graph_node('person:philip','person','Philip','Called to follow Jesus','Philip responds to Jesus’s call and invites Nathanael to come and see.','John 1:43-46',jsonb_build_object('book','john','chapter',1));
select public.upsert_emmaus_graph_node('person:nathanael','person','Nathanael','Israelite without guile','Nathanael moves from skepticism to confession after Jesus reveals supernatural knowledge of him.','John 1:45-51',jsonb_build_object('book','john','chapter',1));

select public.upsert_emmaus_graph_node('discovery:word-became-flesh','discovery','The Word Became Flesh','God dwelling among humanity','John’s prologue declares that the eternal Word entered human life and revealed divine glory.','John 1:14',jsonb_build_object('book','john','chapter',1));
select public.upsert_emmaus_graph_node('discovery:lamb-of-god','discovery','The Lamb of God','Jesus as the sin-bearing Lamb','John the Baptist identifies Jesus as the Lamb of God who takes away the sin of the world.','John 1:29,36',jsonb_build_object('book','john','chapter',1));
select public.upsert_emmaus_graph_node('discovery:come-and-see','discovery','Come and See','Invitation into discipleship','John 1 repeatedly portrays discovery through invitation, encounter, and personal witness.','John 1:39,46',jsonb_build_object('book','john','chapter',1));
select public.upsert_emmaus_graph_node('discovery:heaven-opened','discovery','Heaven Opened','The Son of Man as the meeting place','Jesus alludes to Jacob’s ladder and presents Himself as the connection between heaven and earth.','John 1:51',jsonb_build_object('book','john','chapter',1));

select public.upsert_emmaus_graph_node('passage:genesis-1-1-5','passage','Genesis 1:1-5','Creation, light, and darkness','The opening creation passage that provides crucial background for John’s prologue.','Genesis 1:1-5',jsonb_build_object('book','genesis','chapter',1,'echoed_by','john-1'));
select public.upsert_emmaus_graph_node('passage:exodus-12-passover-lamb','passage','The Passover Lamb','Deliverance through the lamb','The Passover pattern gives essential background for the title Lamb of God.','Exodus 12:1-32',jsonb_build_object('book','exodus','theme','passover'));
select public.upsert_emmaus_graph_node('passage:exodus-33-34-glory','passage','Moses Sees God’s Glory','Glory, grace, and truth','God reveals His glory and covenant character to Moses, providing background for John 1:14-18.','Exodus 33:18-34:8',jsonb_build_object('book','exodus','theme','glory'));
select public.upsert_emmaus_graph_node('passage:genesis-28-jacob-ladder','passage','Jacob’s Ladder','Heaven and earth connected','Jacob sees a stairway between heaven and earth, imagery Jesus applies to Himself.','Genesis 28:10-22',jsonb_build_object('book','genesis','theme','heaven-opened'));
select public.upsert_emmaus_graph_node('passage:isaiah-40-3','passage','A Voice in the Wilderness','Prepare the way of the Lord','Isaiah’s wilderness voice is applied to John the Baptist.','Isaiah 40:3',jsonb_build_object('book','isaiah','quoted_in','john-1'));

-- Discovery questions as graph nodes
select public.upsert_emmaus_graph_node('question:john-1-in-the-beginning','question','Why begin with “In the beginning”?','Observe the opening phrase','Compare John 1:1 with Genesis 1:1. What claims does John make before Jesus enters the story historically?','John 1:1',jsonb_build_object('book','john','chapter',1,'stage','observation'));
select public.upsert_emmaus_graph_node('question:john-1-word-identity','question','Who is the Word?','Trace the clues','List every statement John makes about the Word in verses 1-18. Which clue most clearly identifies Him?','John 1:1-18',jsonb_build_object('book','john','chapter',1,'stage','interpretation'));
select public.upsert_emmaus_graph_node('question:john-1-light-darkness','question','What does light reveal?','Follow the contrast','How do light and darkness function as more than physical images in this chapter?','John 1:4-9',jsonb_build_object('book','john','chapter',1,'stage','connection'));
select public.upsert_emmaus_graph_node('question:john-1-receive-believe','question','What does it mean to receive Him?','Examine belief and identity','How are receiving, believing, and becoming children of God connected?','John 1:11-13',jsonb_build_object('book','john','chapter',1,'stage','application'));
select public.upsert_emmaus_graph_node('question:john-1-tabernacled','question','Why say the Word “dwelt” among us?','Explore the tabernacle echo','How does the language of dwelling or tabernacling deepen the meaning of the incarnation?','John 1:14',jsonb_build_object('book','john','chapter',1,'stage','language'));
select public.upsert_emmaus_graph_node('question:john-1-lamb','question','Why call Jesus the Lamb of God?','Trace sacrifice and deliverance','Which Old Testament lamb patterns help explain John the Baptist’s declaration?','John 1:29',jsonb_build_object('book','john','chapter',1,'stage','connection'));
select public.upsert_emmaus_graph_node('question:john-1-come-see','question','What happens when people “come and see”?','Notice the pattern of witness','How does personal encounter lead to testimony and invitation throughout John 1?','John 1:35-51',jsonb_build_object('book','john','chapter',1,'stage','application'));
select public.upsert_emmaus_graph_node('question:john-1-heaven-open','question','Why reference Jacob’s ladder?','Follow the allusion','What is Jesus claiming about Himself by using the imagery of heaven opened and angels ascending and descending?','John 1:51',jsonb_build_object('book','john','chapter',1,'stage','interpretation'));

-- Core semantic relationships
select public.upsert_emmaus_graph_edge('language:logos','person:jesus','uses_term','John uses Logos to reveal Jesus as God’s eternal self-expression and agent of creation.',1.6,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:word-became-flesh','theme:incarnation','develops_theme','The Word becoming flesh is John’s central declaration of the incarnation.',1.6,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:word-became-flesh','language:eskēnōsen','uses_term','The verb for dwelt evokes the tabernacle and God’s presence among His people.',1.5,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:word-became-flesh','theme:glory','develops_theme','The incarnate Word reveals divine glory.',1.5,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:word-became-flesh','passage:exodus-33-34-glory','alludes_to','John’s language of glory, grace, and truth echoes God’s revelation to Moses.',1.5,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('theme:creation','passage:genesis-1-1-5','alludes_to','John’s opening intentionally echoes Genesis and the creation of light.',1.7,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('theme:light','passage:genesis-1-1-5','alludes_to','John develops Genesis light imagery into a revelation of Christ.',1.5,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:lamb-of-god','passage:exodus-12-passover-lamb','alludes_to','The title Lamb of God draws on sacrificial and Passover imagery.',1.6,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('person:john-the-baptist','passage:isaiah-40-3','quotes','John identifies himself with Isaiah’s voice preparing the way of the Lord.',1.6,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:heaven-opened','passage:genesis-28-jacob-ladder','alludes_to','Jesus applies Jacob’s heaven-and-earth imagery to the Son of Man.',1.7,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:come-and-see','person:andrew','features_person','Andrew follows Jesus and brings Peter.',1.2,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:come-and-see','person:philip','features_person','Philip follows Jesus and invites Nathanael.',1.2,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('discovery:come-and-see','person:nathanael','features_person','Nathanael moves from skepticism to confession through encounter.',1.2,'{"seed":"john-1-v1"}'::jsonb);
select public.upsert_emmaus_graph_edge('theme:new-identity','theme:belief','develops_theme','Receiving and believing in Christ leads to a new identity as children of God.',1.4,'{"seed":"john-1-v1"}'::jsonb);

-- Question routes
select public.upsert_emmaus_graph_edge('question:john-1-in-the-beginning','passage:genesis-1-1-5','recommended_next','Begin by comparing the opening of John with the opening of Genesis.',1.5,'{"route":"john-1-prologue"}'::jsonb);
select public.upsert_emmaus_graph_edge('question:john-1-word-identity','language:logos','recommended_next','Explore the meaning of Logos before forming a conclusion about the Word.',1.4,'{"route":"john-1-prologue"}'::jsonb);
select public.upsert_emmaus_graph_edge('question:john-1-light-darkness','theme:light','recommended_next','Trace the chapter’s light and darkness imagery.',1.3,'{"route":"john-1-prologue"}'::jsonb);
select public.upsert_emmaus_graph_edge('question:john-1-receive-believe','theme:new-identity','recommended_next','Connect belief with the gift of becoming children of God.',1.3,'{"route":"john-1-prologue"}'::jsonb);
select public.upsert_emmaus_graph_edge('question:john-1-tabernacled','language:eskēnōsen','recommended_next','Study the Greek dwelling language and its tabernacle echo.',1.4,'{"route":"john-1-prologue"}'::jsonb);
select public.upsert_emmaus_graph_edge('question:john-1-lamb','discovery:lamb-of-god','recommended_next','Trace the Lamb title through sacrifice and deliverance imagery.',1.5,'{"route":"john-1-witness"}'::jsonb);
select public.upsert_emmaus_graph_edge('question:john-1-come-see','discovery:come-and-see','recommended_next','Follow the witness-and-invitation pattern among the first disciples.',1.3,'{"route":"john-1-disciples"}'::jsonb);
select public.upsert_emmaus_graph_edge('question:john-1-heaven-open','discovery:heaven-opened','recommended_next','Explore Jesus’s allusion to Jacob’s ladder.',1.5,'{"route":"john-1-disciples"}'::jsonb);

create or replace function public.attach_john_1_semantics(p_translation text default 'KJV')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  verse_record record;
  verse_node_key text;
  connected integer := 0;
  missing integer := 0;
begin
  if not public.is_emmaus_admin() then raise exception 'Not authorized'; end if;

  perform public.structure_emmaus_scripture_book(p_translation,'john');

  for verse_record in
    select verse_start, graph_node_id
    from public.emmaus_scripture_nodes
    where translation=p_translation and book_key='john' and chapter=1 and status<>'archived'
    order by verse_start
  loop
    if verse_record.graph_node_id is null then
      missing := missing + 1;
      continue;
    end if;

    select node_key into verse_node_key
    from public.emmaus_graph_nodes
    where id=verse_record.graph_node_id;

    if verse_node_key is null then
      missing := missing + 1;
      continue;
    end if;

    case
      when verse_record.verse_start between 1 and 3 then
        perform public.upsert_emmaus_graph_edge(verse_node_key,'language:logos','uses_term','John identifies Jesus as the eternal Word.',1.5,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'theme:creation','develops_theme','These verses present the Word as active in creation.',1.5,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'passage:genesis-1-1-5','alludes_to','The opening echoes Genesis 1.',1.6,jsonb_build_object('chapter',1));
      when verse_record.verse_start between 4 and 9 then
        perform public.upsert_emmaus_graph_edge(verse_node_key,'theme:life','develops_theme','Life is located in the Word.',1.4,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'theme:light','develops_theme','The Light shines in darkness and gives light to humanity.',1.4,jsonb_build_object('chapter',1));
      when verse_record.verse_start between 10 and 13 then
        perform public.upsert_emmaus_graph_edge(verse_node_key,'theme:belief','develops_theme','The response to the Word is framed as receiving and believing.',1.4,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'theme:new-identity','develops_theme','Believers receive the right to become children of God.',1.4,jsonb_build_object('chapter',1));
      when verse_record.verse_start between 14 and 18 then
        perform public.upsert_emmaus_graph_edge(verse_node_key,'discovery:word-became-flesh','develops_theme','The eternal Word becomes flesh and reveals the Father.',1.6,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'theme:incarnation','develops_theme','These verses explain the incarnation.',1.5,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'theme:glory','develops_theme','The incarnate Son reveals divine glory.',1.4,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'theme:grace','develops_theme','Grace and truth come through Jesus Christ.',1.4,jsonb_build_object('chapter',1));
      when verse_record.verse_start between 19 and 28 then
        perform public.upsert_emmaus_graph_edge(verse_node_key,'person:john-the-baptist','features_person','John the Baptist gives testimony concerning Jesus.',1.3,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'theme:witness','develops_theme','These verses develop John’s witness.',1.3,jsonb_build_object('chapter',1));
      when verse_record.verse_start between 29 and 34 then
        perform public.upsert_emmaus_graph_edge(verse_node_key,'discovery:lamb-of-god','develops_theme','John identifies Jesus as the Lamb of God.',1.6,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'person:john-the-baptist','features_person','John bears witness to Jesus’s identity.',1.3,jsonb_build_object('chapter',1));
      when verse_record.verse_start between 35 and 42 then
        perform public.upsert_emmaus_graph_edge(verse_node_key,'discovery:come-and-see','develops_theme','The first disciples follow through witness and encounter.',1.4,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'person:andrew','features_person','Andrew follows Jesus and brings Peter.',1.2,jsonb_build_object('chapter',1));
      when verse_record.verse_start between 43 and 50 then
        perform public.upsert_emmaus_graph_edge(verse_node_key,'discovery:come-and-see','develops_theme','Philip invites Nathanael to come and see.',1.4,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'person:philip','features_person','Philip is called and becomes a witness.',1.2,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'person:nathanael','features_person','Nathanael encounters Jesus and confesses Him.',1.2,jsonb_build_object('chapter',1));
      when verse_record.verse_start = 51 then
        perform public.upsert_emmaus_graph_edge(verse_node_key,'discovery:heaven-opened','develops_theme','Jesus presents Himself as the meeting place of heaven and earth.',1.6,jsonb_build_object('chapter',1));
        perform public.upsert_emmaus_graph_edge(verse_node_key,'passage:genesis-28-jacob-ladder','alludes_to','Jesus alludes to Jacob’s ladder.',1.7,jsonb_build_object('chapter',1));
    end case;

    connected := connected + 1;
  end loop;

  return jsonb_build_object(
    'translation',p_translation,
    'chapter','John 1',
    'verses_connected',connected,
    'missing_graph_nodes',missing
  );
end;
$$;

grant execute on function public.attach_john_1_semantics(text) to authenticated;
