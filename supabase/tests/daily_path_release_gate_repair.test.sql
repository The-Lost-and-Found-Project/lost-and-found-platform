begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

select ok(not has_function_privilege('anon',
 'public.is_daily_path_day_unlocked(uuid,uuid,integer)','EXECUTE'),
 'anonymous callers cannot invoke the day-release helper');
select ok(has_function_privilege('authenticated',
 'public.is_daily_path_day_unlocked(uuid,uuid,integer)','EXECUTE'),
 'signed-in users may check their own day release');

-- All synthetic records and temporary test grants roll back with this test.
insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at)
values
('00000000-0000-4000-8000-000000000c11','00000000-0000-0000-0000-000000000000','authenticated','authenticated','release-a@example.test',now(),now()),
('00000000-0000-4000-8000-000000000c12','00000000-0000-0000-0000-000000000000','authenticated','authenticated','release-b@example.test',now(),now());
insert into public.bible_studies(id,title,is_published,devotional_cards)
values ('00000000-0000-4000-8000-000000000c21','Synthetic release check',true,'[{"day":1}]'::jsonb);
insert into public.study_sessions(id,bible_study_id,ministry_slug,scheduled_start,daily_path_released_at)
values
('00000000-0000-4000-8000-000000000c22','00000000-0000-4000-8000-000000000c21','hearth',now(),now()-interval '1 hour'),
('00000000-0000-4000-8000-000000000c23','00000000-0000-4000-8000-000000000c21','hearth',now(),null);
insert into public.study_session_participants(study_session_id,user_id)
values
('00000000-0000-4000-8000-000000000c22','00000000-0000-4000-8000-000000000c11'),
('00000000-0000-4000-8000-000000000c22','00000000-0000-4000-8000-000000000c12'),
('00000000-0000-4000-8000-000000000c23','00000000-0000-4000-8000-000000000c11');

grant select,insert,update on public.study_daily_progress,public.study_daily_responses to authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000c11',true);
set local role authenticated;
select ok(public.is_daily_path_day_unlocked(
 '00000000-0000-4000-8000-000000000c11','00000000-0000-4000-8000-000000000c22',1),
 'released day unlocked for assigned member');
select ok(not public.is_daily_path_day_unlocked(
 '00000000-0000-4000-8000-000000000c11','00000000-0000-4000-8000-000000000c23',1),
 'unreleased day remains locked');
select ok(not public.is_daily_path_day_unlocked(
 '00000000-0000-4000-8000-000000000c12','00000000-0000-4000-8000-000000000c22',1),
 'caller cannot probe release status for another identity');
select throws_ok($$insert into public.study_daily_progress(study_session_id,user_id,day_number)
 values ('00000000-0000-4000-8000-000000000c23','00000000-0000-4000-8000-000000000c11',1)$$,
 '42501',null,'unreleased progress write denied despite temporary member grants');
select throws_ok($$insert into public.study_daily_responses(study_session_id,user_id,day_number,response_type,response_text)
 values ('00000000-0000-4000-8000-000000000c23','00000000-0000-4000-8000-000000000c11',1,'private_journal','premature')$$,
 '42501',null,'unreleased journal write denied despite temporary member grants');
select lives_ok($$insert into public.study_daily_progress(study_session_id,user_id,day_number)
 values ('00000000-0000-4000-8000-000000000c22','00000000-0000-4000-8000-000000000c11',1)$$,
 'member can start released day');
select throws_ok($$insert into public.study_daily_responses(study_session_id,user_id,day_number,response_type,response_text)
 values ('00000000-0000-4000-8000-000000000c22','00000000-0000-4000-8000-000000000c12',1,'private_journal','forged')$$,
 '42501',null,'member cannot impersonate another journal author');
reset role;
select is((select count(*)::integer from pg_policies
 where schemaname='public' and tablename='study_daily_responses'),3,
 'exactly three response policies remain; no residual permissive legacy policy');
select * from finish();
rollback;
