begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

-- Synthetic users and curriculum; the transaction is rolled back.
insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at)
values
('00000000-0000-4000-8000-000000000b11','00000000-0000-0000-0000-000000000000','authenticated','authenticated','daily-path-a@example.test',now(),now()),
('00000000-0000-4000-8000-000000000b12','00000000-0000-0000-0000-000000000000','authenticated','authenticated','daily-path-b@example.test',now(),now());

insert into public.bible_studies(id,title,is_published)
values ('00000000-0000-4000-8000-000000000b21','Synthetic Scripture Study',true);
insert into public.study_sessions(id,bible_study_id,ministry_slug,scheduled_start)
values ('00000000-0000-4000-8000-000000000b22','00000000-0000-4000-8000-000000000b21','hearth',now());
insert into public.study_session_participants(study_session_id,user_id)
values ('00000000-0000-4000-8000-000000000b22','00000000-0000-4000-8000-000000000b11'),
('00000000-0000-4000-8000-000000000b22','00000000-0000-4000-8000-000000000b12');
insert into public.study_daily_responses(study_session_id,user_id,day_number,response_type,response_text,locked_at)
values ('00000000-0000-4000-8000-000000000b22','00000000-0000-4000-8000-000000000b11',1,'private_journal','A private note',null),
('00000000-0000-4000-8000-000000000b22','00000000-0000-4000-8000-000000000b12',1,'private_journal','B private note',null),
('00000000-0000-4000-8000-000000000b22','00000000-0000-4000-8000-000000000b12',1,'group_response','B shared note',now());

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000b11',true);
set local role authenticated;
select is((select count(*)::integer from public.study_session_participants),1,'assigned member sees own study assignment');
select is((select count(*)::integer from public.study_daily_responses where response_type='private_journal'),1,
'member A cannot read member B private journal');
select is((select count(*)::integer from public.study_daily_responses where response_type='group_response'),0,
'member A cannot read B locked group response until A has locked their own');
select lives_ok($$insert into public.study_daily_progress(study_session_id,user_id,day_number)
values ('00000000-0000-4000-8000-000000000b22','00000000-0000-4000-8000-000000000b11',1)$$,
'assigned member may start own Daily Path');
select throws_ok($$insert into public.study_daily_progress(study_session_id,user_id,day_number)
values ('00000000-0000-4000-8000-000000000b22','00000000-0000-4000-8000-000000000b12',2)$$,'42501',null,
'member cannot write other member progress');
select throws_ok($$insert into public.study_daily_responses(study_session_id,user_id,day_number,response_type,response_text)
values ('00000000-0000-4000-8000-000000000b22','00000000-0000-4000-8000-000000000b12',2,'private_journal','unauthorized')$$,
'42501',null,'member cannot write other member journal');
reset role;

insert into public.study_daily_responses(study_session_id,user_id,day_number,response_type,response_text,locked_at)
values ('00000000-0000-4000-8000-000000000b22','00000000-0000-4000-8000-000000000b11',1,'group_response','A shared note',now());

set local role authenticated;
select is((select count(*)::integer from public.study_daily_responses where response_type='group_response'),2,
'after locking own answer member can read shared answers');
select is((select count(*)::integer from public.study_daily_responses where response_type='private_journal'),1,
'group response visibility does not reveal another private journal');
select throws_ok($$delete from public.study_daily_responses where user_id='00000000-0000-4000-8000-000000000b11'$$,
'42501',null,'member cannot directly delete personal response');
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000b12',true);
set local role authenticated;
select is((select count(*)::integer from public.study_daily_progress),0,
'other participant cannot inspect member A daily progress');
reset role;

select * from finish();
rollback;
