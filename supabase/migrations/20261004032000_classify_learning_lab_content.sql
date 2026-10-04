-- Learning Lab curriculum classification.
-- Preserve the legacy question bank while separating editorial disposition
-- from member-visible approval status and historical quiz attempts.

do $migration$
begin
  if to_regclass('public.trivia_questions') is null then
    raise notice 'Skipping Learning Lab classification: trivia_questions is not present in the fresh migration baseline.';
    return;
  end if;

  alter table public.trivia_questions
    add column if not exists learning_lab_disposition text,
    add column if not exists learning_lab_target text,
    add column if not exists learning_lab_review_note text,
    add column if not exists learning_lab_reviewed_at timestamptz;
  
  alter table public.trivia_questions
    drop constraint if exists trivia_questions_learning_lab_disposition_check;
  alter table public.trivia_questions
    add constraint trivia_questions_learning_lab_disposition_check
    check (learning_lab_disposition is null or learning_lab_disposition in ('keep','move','rebuild','retire'));
  
  alter table public.trivia_questions
    drop constraint if exists trivia_questions_learning_lab_target_check;
  alter table public.trivia_questions
    add constraint trivia_questions_learning_lab_target_check
    check (learning_lab_target is null or learning_lab_target in (
      'trivia','language','context','geography','connections','people','timeline','books','observation','study-skills'
    ));
  
  comment on column public.trivia_questions.learning_lab_disposition is
    'Editorial curriculum disposition. Null means not yet reviewed; does not change historical quiz data.';
  comment on column public.trivia_questions.learning_lab_target is
    'Single Learning Lab objective this source item best supports after review.';
  comment on column public.trivia_questions.learning_lab_review_note is
    'Editorial note explaining why the item is kept, moved, rebuilt, or retired.';
  
  -- Categories whose purpose already maps cleanly to a specialist Lab are
  -- classified as source material without pretending the current isolated
  -- question format is the finished lesson experience.
  update public.trivia_questions
  set learning_lab_disposition='rebuild',
      learning_lab_target='language',
      learning_lab_review_note='Useful source material, but Language Insights is now passage-first rather than isolated vocabulary trivia.'
  where status='approved' and category_id='language-insights' and learning_lab_disposition is null;
  
  update public.trivia_questions
  set learning_lab_disposition='move',
      learning_lab_target='context',
      learning_lab_review_note='Move from general trivia into Context Lab; retain only after passage/context review.'
  where status='approved' and category_id='bible-context' and learning_lab_disposition is null;
  
  update public.trivia_questions
  set learning_lab_disposition='move',
      learning_lab_target='geography',
      learning_lab_review_note='Move from general trivia into Bible Geography and connect the fact to its passage.'
  where status='approved' and category_id='bible-geography' and learning_lab_disposition is null;
  
  update public.trivia_questions
  set learning_lab_disposition='move',
      learning_lab_target='connections',
      learning_lab_review_note='Move from general trivia into Connections and verify the relationship is explicit or responsibly inferred.'
  where status='approved' and category_id='connections' and learning_lab_disposition is null;
  
  -- High-confidence book/narrative banks remain candidates for factual Trivia.
  -- Notes still require theological/editorial review before this classification
  -- should be considered final.
  update public.trivia_questions
  set learning_lab_disposition='keep',
      learning_lab_target='trivia',
      learning_lab_review_note='High-confidence factual Bible-knowledge source. Keep in Trivia subject to answer/note accuracy review.'
  where status='approved'
    and category_id in ('the-gospels','acts','hebrews','bible-basics','mixed-challenge')
    and learning_lab_disposition is null;
  
  -- Topical banks are deliberately left unclassified. Their questions mix
  -- factual recall, interpretation, application, and pastoral teaching and
  -- require item-by-item review rather than bulk relabeling.
  
end
$migration$;
