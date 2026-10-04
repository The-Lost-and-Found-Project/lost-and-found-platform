-- Third Learning Lab editorial correction batch: context-sensitive promises and duplicates.
do $migration$
begin
  if to_regclass('public.trivia_questions') is null then
    raise notice 'Skipping Learning Lab content corrections: trivia_questions is not present.';
    return;
  end if;

  update public.trivia_questions
  set question='While Judah was in exile, what future did the LORD say He intended for His people in Jeremiah 29:11?',
      correct='Welfare and hope rather than ultimate calamity',
      ref='Jeremiah 29:10-14',
      note='Jeremiah speaks to Judean exiles who were told to settle in Babylon and expect a long exile before God brought them back. Verse 11 expresses God''s covenant faithfulness to that community; it is not a promise that every individual plan will prosper or avoid hardship.'
  where id='ec2f9ffe-8b8b-4bf4-96bd-bdb3521f9794';

  update public.trivia_questions
  set status='draft',
      note='Retired as a duplicate of the reviewed Jeremiah 29:10-14 item. Preserve historical attempts, but do not serve another copy of the same learning objective.'
  where id in ('18ee8d62-f983-42a7-be25-60c67554ed78','fbab0e2d-f95d-4522-8377-5635fc778b75');

  update public.trivia_questions
  set question='In Psalm 30:5, how does the psalmist contrast God''s anger and favor, weeping and joy?',
      correct='Anger is momentary but favor lasts; weeping may lodge for a night, but joy comes in the morning',
      note='Psalm 30 is a song of thanksgiving for deliverance. Its night-and-morning poetry celebrates the psalmist''s experienced reversal; it gives real hope in God without promising that every season of grief will end by the next morning.'
  where id='cfe9aa00-94ac-4ab8-b269-1b64b9f120d2';

  update public.trivia_questions
  set status='draft',
      note='Retired as a near-duplicate of the reviewed Psalm 30:5 question.'
  where id='fcece15a-10d7-4a26-a0f0-74f42bc64174';

  update public.trivia_questions
  set question='In Isaiah 61:1-3, what does the anointed herald proclaim for those who mourn in Zion?',
      correct='Comfort and a beautiful headdress instead of ashes, gladness instead of mourning, and praise instead of a faint spirit',
      ref='Isaiah 61:1-3',
      note='Isaiah 61 announces good news, comfort, and restoration to Zion. Jesus later reads this passage in Luke 4:16-21 in relation to His mission. Its imagery should be taught in that redemptive setting rather than as a formula that every loss will be replaced in the same form.'
  where id='31cf9ed4-b5ca-4a58-af11-23a0a56c5ba7';

  update public.trivia_questions
  set status='draft',
      note='Retired as a duplicate of the reviewed Isaiah 61:1-3 question.'
  where id='8c3b6da1-f68b-4ad4-837e-5ee0a694c3a1';

  update public.trivia_questions
  set question='In Zephaniah 3:14-17, why is restored Zion told to rejoice?',
      correct='The LORD has removed judgment, is present among His people, saves, and rejoices over them',
      ref='Zephaniah 3:14-17',
      note='The rejoicing language belongs to Zephaniah''s restoration oracle for Zion after judgment. It reveals God''s saving delight in His restored people without erasing the prophecy''s covenant and judgment context.'
  where id='25e73328-6c84-4fe5-bbf5-57cc8f4107e2';

  update public.trivia_questions
  set question='According to Romans 8:28-29, what good is God working toward for those who love Him and are called according to His purpose?',
      correct='His redemptive purpose, including conforming them to the image of His Son',
      ref='Romans 8:28-29',
      note='Paul does not call every circumstance good. He says God works in all things toward His purpose, and verse 29 immediately describes that purpose in terms of conformity to Christ.'
  where id='77f3381d-9fd7-474f-baca-053251d45fba';

  update public.trivia_questions
  set question='What had Paul learned before saying he could do all things through the one who strengthened him?',
      correct='To be content in both plenty and hunger, abundance and need',
      ref='Philippians 4:11-13',
      note='Philippians 4:13 concerns Christ-given strength for contentment across changing circumstances. It is not a blank check for unlimited achievement.'
  where id='d57bdbeb-c104-44c4-85ff-42ec59d3d4ca';

  update public.trivia_questions
  set status='draft',
      note='Retired as a duplicate of the reviewed Philippians 4:11-13 context question.'
  where id='d53834bf-1c9d-4ae0-ba42-5ee9c8ca3683';
end
$migration$;
