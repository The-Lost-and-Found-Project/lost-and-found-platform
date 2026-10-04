-- Consolidate duplicate Learning Lab objectives without deduping merely by verse.
do $migration$
begin
  if to_regclass('public.trivia_questions') is null then
    raise notice 'Skipping Learning Lab deduplication: trivia_questions is not present.';
    return;
  end if;

  -- Hebrews 11:1: retain one complete factual formulation.
  update public.trivia_questions
  set note='Hebrews 11:1 introduces the chapter''s portrait of faith as assurance regarding what is hoped for and conviction regarding what is not seen. The examples that follow show faith expressed through trust and action.'
  where id='62afe1c6-5914-43df-a1e2-dc17ca57e0c7';

  update public.trivia_questions
  set status='draft',
      note='Retired as a duplicate of the reviewed Hebrews 11:1 learning objective.'
  where id in (
    '72e31d71-849d-476e-8670-3672f938f035',
    '9492189e-4923-4598-9a12-c56fc7280c95',
    '23c2792d-7126-42c4-af0a-8c31ec42afc2'
  );

  -- Hebrews 12:1 contains distinct facts. Keep one witnesses question and one
  -- weight/sin question; retire only same-objective copies.
  update public.trivia_questions
  set status='draft',
      note='Retired as a duplicate of the retained Hebrews 12:1 great-cloud-of-witnesses objective.'
  where id='056471a6-cc03-4f2b-a45b-06bfe4230a4a';

  update public.trivia_questions
  set status='draft',
      note='Retired as a duplicate of the retained Hebrews 12:1 weight-and-sin objective.'
  where id='89b92883-122a-48ca-a089-27a0eb274d7f';

  -- Matthew 6:33: retain the fuller wording and keep the promise inside
  -- Jesus' teaching about anxiety over food, drink, and clothing.
  update public.trivia_questions
  set question='According to Matthew 6:33, what does Jesus tell His hearers to seek first?',
      correct='God''s kingdom and His righteousness',
      ref='Matthew 6:25-34',
      note='Jesus contrasts anxious pursuit of food, drink, and clothing with seeking God''s kingdom and righteousness. “All these things” refers to the necessities named in the surrounding paragraph, not everything a person may want.'
  where id='348e9cd5-5279-4cf7-a74a-78f9bb04fabb';

  update public.trivia_questions
  set status='draft',
      note='Retired as a duplicate of the reviewed Matthew 6:25-34 learning objective.'
  where id in (
    'a63d8bf4-7b48-498d-ad0f-565b78b3a4e3',
    'd913057f-d27e-4c7d-8941-3f6c8938ba79',
    'a89f362a-5d27-4ab9-8188-7337c65790cf'
  );

  -- John 20: retain one Gospel-identification objective and one Thomas fact.
  update public.trivia_questions
  set question='Which Gospel records Thomas'' encounter with the risen Jesus?',
      correct='John',
      note='John 20:24-29 records Thomas moving from refusal to believe the other disciples'' testimony to the confession, “My Lord and my God!” after Jesus appears to him.'
  where id='5d90e97d-a0b7-4c66-b25f-f499c43aa27c';

  update public.trivia_questions
  set status='draft',
      note='Retired as a duplicate of the retained John 20 Gospel-identification objective.'
  where id='9901fe29-c1a2-4ecb-9e31-46e913ecca6d';

  update public.trivia_questions
  set question='Which disciple said he would not believe Jesus had risen unless he saw the marks of the nails?',
      correct='Thomas',
      note='John 20:24-29 records Thomas'' stated condition for belief and Jesus'' later appearance to him. Scripture names him Thomas (also called Didymus); “Doubting Thomas” is a later nickname, not a biblical title.'
  where id='5f040eba-3c34-456e-b6bc-14ac2f87d199';

  update public.trivia_questions
  set status='draft',
      note='Retired as a duplicate of the reviewed Thomas learning objective.'
  where id='34d0078e-51b6-42d4-ab0b-2aee2199cbe7';

  -- Luke 15: keep the fact while distinguishing parable imagery from a direct
  -- narrator statement identifying the father as God.
  update public.trivia_questions
  set note='In Jesus'' parable, the father sees the returning son, feels compassion, runs, embraces him, and kisses him. The story powerfully portrays the welcome of the lost in Luke 15; the application should arise from the parable as a whole rather than treating every narrative detail as a one-to-one allegorical definition.'
  where id='9cec7141-cebc-480a-9bd0-2f10a526f123';
end
$migration$;
