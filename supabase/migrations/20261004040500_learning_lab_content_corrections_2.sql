-- Second Learning Lab editorial correction batch.
do $migration$
begin
  if to_regclass('public.trivia_questions') is null then
    raise notice 'Skipping Learning Lab content corrections: trivia_questions is not present.';
    return;
  end if;

  update public.trivia_questions
  set question='Who obeyed God by building the ark according to His instructions?',
      correct='Noah',
      note='Genesis emphasizes that Noah did all God commanded him. Scripture does not say that rain had never fallen before the flood, so that popular detail should not be taught as a biblical fact.'
  where id='06bcfe2e-97aa-41a5-8be1-5c46386a16ae';

  update public.trivia_questions
  set question='What did Noah do in response to God''s instructions about the ark?',
      correct='He did all that God commanded him',
      note='Genesis 6:22 explicitly emphasizes Noah''s obedience. Claims that he had never seen rain or that the command made no earthly sense go beyond what Genesis states.'
  where id='b41d16be-f2ed-4955-9c98-cea9a7491ab8';

  update public.trivia_questions
  set note='Jonah 3 says Nineveh believed God, fasted, turned from evil and violence, and that God relented from the announced disaster when He saw what they did. The story emphasizes repentance and divine mercy.'
  where id='0fec0487-5ee2-46c4-9672-1b92123684bc';

  update public.trivia_questions
  set note='Rahab confesses the LORD''s supremacy and protects the spies. The New Testament later points to her faith and actions (Hebrews 11:31; James 2:25), and Matthew 1:5 includes Rahab in Jesus'' genealogy.'
  where id='168420f0-fd6e-4302-be7c-4e117940631d';

  update public.trivia_questions
  set note='Job 42 records that the LORD restored Job''s fortunes and gave him twice as much as before. This describes what God did for Job; it is not a universal formula promising every sufferer a doubled material restoration.'
  where id='b8ce38c3-709c-43ee-870b-b8f3b3e60826';

  update public.trivia_questions
  set question='In Joel 2:25, what does the LORD promise to restore to His people after the locust devastation?',
      correct='The years consumed by the locusts',
      note='Joel addresses Judah after devastating locust judgment and calls the people to return to the LORD. The restoration promise belongs first to that covenant setting; it should not be detached into a guarantee that every personally “wasted year” will be repaid in kind.'
  where id='a2f0d6d7-de68-47b0-a0c5-5d09eed3e662';

  update public.trivia_questions
  set question='In Isaiah 43:18-19, what new act does God tell Israel to watch for?',
      correct='A new thing He is doing, making a way in the wilderness',
      note='Isaiah speaks hope to Israel in the setting of exile and promised deliverance, echoing a new-exodus pattern. The passage can encourage believers, but its first meaning is not a generic command to forget every painful part of one''s personal past.'
  where id='ea053463-61f6-4648-9574-e255c3b98c23';

  update public.trivia_questions
  set question='In John 21:15-17, what commission does Jesus repeatedly give Peter as He asks about Peter''s love?',
      correct='Care for / feed His sheep',
      note='Jesus asks Peter three times about his love and repeatedly commissions him to care for Jesus'' sheep. Readers often connect the three questions with Peter''s three denials; that is a reasonable literary observation, but John does not explicitly explain the scene that way.'
  where id='b9025e1f-c145-4b26-a974-6b7228e81140';
end
$migration$;
