\set ON_ERROR_STOP on
begin;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000000','authenticated','authenticated','audit-admin@example.invalid',''),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000000','authenticated','authenticated','audit-facilitator@example.invalid',''),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','00000000-0000-0000-0000-000000000000','authenticated','authenticated','audit-member@example.invalid','');
update public.profiles set role='admin',is_active=true where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.study_groups(id,ministry_slug,name) values ('11111111-1111-4111-8111-111111111111','mens','audit fixture');
insert into public.study_group_members(group_id,user_id,group_role,membership_status) values ('11111111-1111-4111-8111-111111111111','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','facilitator','active');
insert into public.bible_studies(id,title,devotional_cards) values ('22222222-2222-4222-8222-222222222222','Audit study','[{"day":1}]'::jsonb);
insert into public.study_sessions(id,bible_study_id,ministry_slug,scheduled_start,daily_path_released_at) values ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','mens-study',now(),now()-interval '2 days');
insert into public.study_session_participants(study_session_id,user_id) values ('33333333-3333-4333-8333-333333333333','cccccccc-cccc-4ccc-8ccc-cccccccccccc');
insert into public.study_daily_responses(study_session_id,user_id,day_number,response_type,response_text,locked_at) values ('33333333-3333-4333-8333-333333333333','cccccccc-cccc-4ccc-8ccc-cccccccccccc',1,'group_response','Audit response',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$begin if not public.is_lfp_admin(auth.uid()) then raise exception 'admin denied'; end if; if public.is_lfp_admin('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') then raise exception 'other admin exposed'; end if; end$$;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$begin if not public.is_study_group_facilitator(auth.uid(),'11111111-1111-4111-8111-111111111111') then raise exception 'facilitator denied'; end if; if public.is_lfp_admin(auth.uid()) then raise exception 'facilitator admin'; end if; end$$;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$begin if not public.is_daily_path_day_unlocked(auth.uid(),'33333333-3333-4333-8333-333333333333',1) then raise exception 'member day denied'; end if; if not public.has_locked_group_response(auth.uid(),'33333333-3333-4333-8333-333333333333',1) then raise exception 'member response denied'; end if; if public.has_locked_group_response('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','33333333-3333-4333-8333-333333333333',1) then raise exception 'cross member exposed'; end if; end$$;
rollback;
select 'PASS: admin, facilitator, member positive and cross-user negative';