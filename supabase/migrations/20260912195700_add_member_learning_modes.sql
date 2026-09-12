insert into public.trivia_categories (id,name,description,sort_order,is_active)
values ('language-insights','Language Insights','Hebrew and Greek insights that deepen understanding of Scripture.',95,true)
on conflict (id) do update set name=excluded.name, description=excluded.description, is_active=true;

insert into public.trivia_questions (category_id,question,choices,correct,ref,note,status,source)
select * from (values
('language-insights','What does the Greek word agape most often describe in the New Testament?','["Self-giving love","Fear","Knowledge","Tradition"]'::jsonb,'Self-giving love','1 Corinthians 13:4-7','Agape describes self-giving love shaped by God''s character. Context determines nuance, so it should not be reduced to a single dictionary gloss.','approved','manual'),
('language-insights','What is the basic sense of the Hebrew word shalom?','["Peace and wholeness","Anger","Sacrifice","Judgment"]'::jsonb,'Peace and wholeness','Numbers 6:24-26','Shalom includes peace, well-being, completeness, and restored relationship.','approved','manual'),
('language-insights','The Greek word metanoia is commonly translated as what?','["Repentance","Worship","Wisdom","Covenant"]'::jsonb,'Repentance','Acts 2:38','Metanoia involves a changed mind and direction, not merely feeling regret.','approved','manual'),
('language-insights','What does the Hebrew word ruach commonly mean?','["Spirit, wind, or breath","Temple","Promise","King"]'::jsonb,'Spirit, wind, or breath','Genesis 1:2','Ruach can mean spirit, wind, or breath; context shows which sense is intended.','approved','manual'),
('language-insights','What does logos mean in John 1:1?','["Word","Temple","Law court","Sacrifice"]'::jsonb,'Word','John 1:1','John uses Logos as a title for the eternal Son, connecting revelation, creation, and God''s self-expression.','approved','manual'),
('language-insights','What does the Hebrew word hesed often communicate?','["Steadfast covenant love","Military strength","Temple tax","Human wisdom"]'::jsonb,'Steadfast covenant love','Psalm 136:1','Hesed often carries the ideas of loyal, steadfast, covenant love and mercy.','approved','manual'),
('language-insights','Why should a Hebrew or Greek word not always be given one fixed English meaning?','["Context determines meaning","The Bible has no meaning","English is always better","Grammar does not matter"]'::jsonb,'Context determines meaning','Philippians 2:5-8','Words have semantic ranges. The sentence, author, genre, and context determine which sense is active.','approved','manual'),
('language-insights','The Greek word ekklesia is usually translated as what?','["Church or assembly","Priesthood","Prophecy","Prayer"]'::jsonb,'Church or assembly','Matthew 16:18','Ekklesia refers to an assembly or gathered people; in the New Testament it commonly names the gathered people of God.','approved','manual'),
('language-insights','What is the basic meaning of the Greek word charis?','["Grace or favor","Wrath","Law","Temple"]'::jsonb,'Grace or favor','Ephesians 2:8','Charis speaks of grace, favor, and gift, especially God''s undeserved favor in salvation.','approved','manual'),
('language-insights','What does the Hebrew word nephesh often refer to?','["A living person or life","Only an immaterial soul","A priestly garment","A feast day"]'::jsonb,'A living person or life','Genesis 2:7','Nephesh can refer to life, person, self, or living being. It should not automatically be read through later philosophical categories.','approved','manual')
) as v(category_id,question,choices,correct,ref,note,status,source)
where not exists (select 1 from public.trivia_questions q where q.category_id=v.category_id and q.question=v.question);

create table if not exists public.memory_verses (
 id uuid primary key default gen_random_uuid(), reference text not null unique, verse_text text not null,
 translation text not null default 'WEB', topic text,
 difficulty text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
 is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.memory_verse_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 verse_id uuid not null references public.memory_verses(id) on delete cascade,
 mastery integer not null default 0 check (mastery between 0 and 5),
 next_review_at timestamptz not null default now(), last_reviewed_at timestamptz,
 correct_streak integer not null default 0, primary key(user_id,verse_id)
);
alter table public.memory_verses enable row level security;
alter table public.memory_verse_progress enable row level security;
drop policy if exists "Members read active memory verses" on public.memory_verses;
create policy "Members read active memory verses" on public.memory_verses for select to authenticated using (is_active=true);
drop policy if exists "Users manage own verse progress" on public.memory_verse_progress;
create policy "Users manage own verse progress" on public.memory_verse_progress for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

insert into public.memory_verses(reference,verse_text,topic,difficulty) values
('Psalm 119:105','Your word is a lamp to my feet, and a light for my path.','Scripture','beginner'),
('Proverbs 3:5-6','Trust in Yahweh with all your heart, and don''t lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.','Trust','intermediate'),
('Philippians 4:6-7','In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.','Prayer','advanced'),
('Romans 8:28','We know that all things work together for good for those who love God, for those who are called according to his purpose.','Hope','intermediate'),
('2 Corinthians 5:17','Therefore if anyone is in Christ, he is a new creation. The old things have passed away. Behold, all things have become new.','Identity','beginner'),
('Joshua 1:9','Haven''t I commanded you? Be strong and courageous. Don''t be afraid. Don''t be dismayed, for Yahweh your God is with you wherever you go.','Courage','intermediate')
on conflict(reference) do nothing;
