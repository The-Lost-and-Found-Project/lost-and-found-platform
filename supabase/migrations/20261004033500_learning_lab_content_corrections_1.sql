-- First Learning Lab editorial corrections.
-- These updates narrow teaching notes to what the cited texts actually support
-- and remove one duplicate question whose wording depends too heavily on a
-- disputed/translation-sensitive rendering.

do $migration$
begin
  if to_regclass('public.trivia_questions') is null then
    raise notice 'Skipping Learning Lab content corrections: trivia_questions is not present.';
    return;
  end if;

  update public.trivia_questions
  set note='Ecclesiastes 4:9-12 praises the strength of companionship and uses a three-strand cord as an image of greater resilience. The passage does not explicitly identify God as the third strand.'
  where id='ca5149b6-5a43-449e-9921-7c5784383cc1';

  update public.trivia_questions
  set note='Proverbs 22:6 is wisdom literature: it commends intentional formation of a child, but it should not be treated as an unconditional guarantee about every child''s future choices.'
  where id in (
    'ccad4339-5a3d-4515-a11d-aede132c3830',
    'dc218b19-bfc2-4ed2-88a1-011538913c78',
    '9a576aa4-916e-4d48-8efb-834e1dd4bda5'
  );

  update public.trivia_questions
  set note='Proverbs 16:3 calls people to entrust their work to the Lord. As wisdom literature, it is not a promise that every personal plan will be approved, prosper, or unfold exactly as intended.'
  where id in (
    'c8b3df3b-a856-4344-870e-cfab3a520c16',
    '23d38d14-881d-4636-a52b-2831f4c6b664'
  );

  update public.trivia_questions
  set note='Paul says temptation is common to humanity and that God is faithful to provide a way to endure it. The verse addresses temptation specifically; it should not be generalized into a promise that God will never allow any hardship beyond a person''s strength.'
  where id='2b998845-98c9-4660-996c-91fc176493d2';

  update public.trivia_questions
  set question='What covenant failure does Malachi 2:14-16 confront?',
      correct='Faithlessness toward one''s wife',
      ref='Malachi 2:14-16',
      note='Malachi condemns marital faithlessness and violence against the covenant partner. English translations differ on the exact wording of verse 16, so the lesson should rest on the paragraph''s clear covenant emphasis rather than a disputed slogan.'
  where id='dd1fdf92-d9a1-4afc-8be8-b711ea8a5bda';

  update public.trivia_questions
  set status='draft',
      note='Retired as a duplicate because the question reduces a translation-sensitive text to a disputed one-line quotation. Use the reviewed Malachi 2:14-16 covenant-faithfulness question instead.'
  where id='df2df1ee-b9e3-42ad-a10a-6a432e0004c8';

end
$migration$;
