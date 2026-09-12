alter table public.trivia_questions add column if not exists difficulty text not null default 'intermediate' check (difficulty in ('beginner','intermediate','advanced'));

create or replace function public.get_quiz_questions_v2(p_category_id text, p_limit integer default 10, p_difficulty text default null)
returns setof public.trivia_questions
language sql
stable
set search_path=''
as $$
  select * from public.trivia_questions
  where category_id = p_category_id
    and status = 'approved'
    and (p_difficulty is null or difficulty = p_difficulty)
  order by random()
  limit p_limit;
$$;

grant execute on function public.get_quiz_questions_v2(text,integer,text) to authenticated;

insert into public.trivia_categories(id,name,description,sort_order,is_active) values
('bible-context','Bible Context','Culture, setting, genre, and background that clarify Scripture.',88,true),
('bible-geography','Bible Geography','Places, regions, journeys, and the land of the Bible.',89,true),
('connections','Connections & Foreshadowing','Patterns and connections across the biblical story.',90,true)
on conflict(id) do update set name=excluded.name,description=excluded.description,is_active=true;

insert into public.trivia_questions(category_id,question,choices,correct,ref,note,status,source,difficulty)
select * from (values
('language-insights','In Romans 8, what does the Greek word pneuma commonly mean?','["Spirit","Temple","Kingdom","Law"]'::jsonb,'Spirit','Romans 8:9','Pneuma can mean spirit, wind, or breath. In Romans 8 the context centers on the Holy Spirit and life in Christ.','approved','manual','beginner'),
('language-insights','The Greek word koinonia most directly refers to what?','["Fellowship or sharing","Judgment","Temple sacrifice","Royal authority"]'::jsonb,'Fellowship or sharing','Acts 2:42','Koinonia describes participation, sharing, and fellowship. It is more active than casual social contact.','approved','manual','beginner'),
('language-insights','What does the Greek word diakonia emphasize?','["Service or ministry","Prophecy","Kingship","Pilgrimage"]'::jsonb,'Service or ministry','2 Corinthians 4:1','Diakonia refers to service or ministry and helps frame leadership as service rather than status.','approved','manual','intermediate'),
('language-insights','The Hebrew word torah is broader than which English word often used for it?','["Law","Song","Temple","Prophet"]'::jsonb,'Law','Psalm 1:2','Torah can include instruction or teaching, not only legal commands. Context determines emphasis.','approved','manual','intermediate'),
('language-insights','What does the Hebrew word emet often communicate?','["Truth and faithfulness","Fear and trembling","Sacrifice and offering","Wisdom and skill"]'::jsonb,'Truth and faithfulness','Exodus 34:6','Emet can carry ideas of truth, reliability, firmness, and faithfulness.','approved','manual','advanced'),
('language-insights','Why can word studies become misleading when isolated from a verse?','["Meaning depends on context and grammar","Greek words never change meaning","English translations are always wrong","Every word is symbolic"]'::jsonb,'Meaning depends on context and grammar','Philippians 2:5-11','A word has a range of possible meanings; syntax, author, genre, and immediate context determine the intended sense.','approved','manual','advanced'),
('bible-context','Why were genealogies important in the biblical world?','["They established identity and covenant lineage","They were only decorative","They replaced legal records","They were secret priestly codes"]'::jsonb,'They established identity and covenant lineage','Matthew 1:1-17','Genealogies establish identity, continuity, inheritance, and covenant connections.','approved','manual','beginner'),
('bible-context','What kind of literature is much of Proverbs?','["Wisdom literature","Apocalyptic prophecy","Legal code","Narrative history"]'::jsonb,'Wisdom literature','Proverbs 1:1-7','Proverbs generally offers wise patterns for faithful living, not unconditional promises detached from context.','approved','manual','beginner'),
('bible-context','Why does understanding first-century honor and shame culture help with the Gospels?','["It clarifies many public conflicts and social expectations","It changes the text itself","It makes geography unnecessary","It proves every parable is literal"]'::jsonb,'It clarifies many public conflicts and social expectations','Luke 15:11-32','Honor, shame, family status, hospitality, and public reputation often shape the social force of Gospel scenes.','approved','manual','intermediate'),
('bible-context','What is a key reason letters like Romans should be read as whole arguments?','["Individual verses participate in a larger flow of thought","Chapter numbers were original","Every paragraph is unrelated","Paul wrote only for scholars"]'::jsonb,'Individual verses participate in a larger flow of thought','Romans 1:16-17','New Testament letters develop arguments across paragraphs and sections, so isolated verses can be misunderstood.','approved','manual','intermediate'),
('bible-context','In apocalyptic literature, symbols should usually be interpreted how?','["Within literary and biblical context","As modern newspaper codes by default","As meaningless decoration","Only by numerical value"]'::jsonb,'Within literary and biblical context','Revelation 1:1','Apocalyptic imagery draws on earlier Scripture and symbolic conventions. Context should control interpretation.','approved','manual','advanced'),
('bible-geography','Jerusalem is located in which broad region of biblical Israel?','["Judea","Galilee","Samaria","Decapolis"]'::jsonb,'Judea','Matthew 2:1','Jerusalem sits in the hill country of Judea and became Israel''s political and worship center.','approved','manual','beginner'),
('bible-geography','Jesus grew up in which Galilean town?','["Nazareth","Bethany","Jericho","Caesarea"]'::jsonb,'Nazareth','Luke 4:16','Nazareth was a small town in Galilee and the place where Jesus was raised.','approved','manual','beginner'),
('bible-geography','Which body of water is central to many Gospel ministry scenes?','["Sea of Galilee","Dead Sea","Mediterranean Sea","Red Sea"]'::jsonb,'Sea of Galilee','Mark 1:16','Fishing, storms, crossings, and several miracles occur around the Sea of Galilee.','approved','manual','beginner'),
('bible-geography','Why was Samaria socially significant in Jesus'' ministry?','["Jews and Samaritans had deep historical tensions","It was outside the Roman Empire","It had no towns","Only priests lived there"]'::jsonb,'Jews and Samaritans had deep historical tensions','John 4:9','The history between Jews and Samaritans gives added force to Jesus'' interactions and parables involving Samaritans.','approved','manual','intermediate'),
('bible-geography','Paul''s missionary journeys frequently moved through which wider world?','["Eastern Roman Empire","Persian royal court only","Sub-Saharan Africa only","Northern Europe only"]'::jsonb,'Eastern Roman Empire','Acts 13:1-4','Acts traces the gospel through cities, roads, ports, and provinces of the eastern Roman world.','approved','manual','intermediate'),
('connections','Matthew presents Jesus as reliving parts of whose story?','["Israel''s story","Rome''s founding story","Babylon''s royal story","Greek mythology"]'::jsonb,'Israel''s story','Matthew 2:15','Matthew repeatedly frames Jesus in patterns associated with Israel, including exodus, wilderness, and fulfillment themes.','approved','manual','intermediate'),
('connections','The Passover lamb most directly provides background for which New Testament theme?','["Deliverance through sacrificial death","Temple architecture","Wisdom sayings","Roman citizenship"]'::jsonb,'Deliverance through sacrificial death','1 Corinthians 5:7','New Testament writers connect Christ''s death with Passover imagery of deliverance and sacrifice.','approved','manual','intermediate'),
('connections','Hebrews compares Jesus'' priesthood to which figure?','["Melchizedek","Saul","Elijah","Nehemiah"]'::jsonb,'Melchizedek','Hebrews 7:1-17','Hebrews uses Melchizedek to explain the distinctiveness and superiority of Jesus'' priesthood.','approved','manual','advanced'),
('connections','The bronze serpent in Numbers becomes a comparison for what in John 3?','["The Son of Man being lifted up","The rebuilding of the temple","The calling of disciples","The feeding of the five thousand"]'::jsonb,'The Son of Man being lifted up','John 3:14-15','Jesus explicitly connects the lifted bronze serpent with his own being lifted up, emphasizing faith and life.','approved','manual','advanced')
) as v(category_id,question,choices,correct,ref,note,status,source,difficulty)
where not exists (select 1 from public.trivia_questions q where q.category_id=v.category_id and q.question=v.question);

insert into public.memory_verses(reference,verse_text,topic,difficulty) values
('John 3:16','For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.','Gospel','beginner'),
('Galatians 2:20','I have been crucified with Christ, and it is no longer I that live, but Christ lives in me. That life which I now live in the flesh, I live by faith in the Son of God, who loved me, and gave himself up for me.','Identity','advanced'),
('Micah 6:8','He has shown you, O man, what is good. What does Yahweh require of you, but to act justly, to love mercy, and to walk humbly with your God?','Faithful Living','intermediate'),
('Psalm 46:10','Be still, and know that I am God. I will be exalted among the nations. I will be exalted in the earth.','Trust','beginner'),
('Matthew 6:33','But seek first God''s Kingdom, and his righteousness; and all these things will be given to you as well.','Priority','beginner'),
('James 1:5','But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach; and it will be given to him.','Wisdom','beginner')
on conflict(reference) do nothing;