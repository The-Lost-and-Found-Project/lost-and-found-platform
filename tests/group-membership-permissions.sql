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
update public.study_sessions set group_id='11111111-1111-4111-8111-111111111111',facilitator_user_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' where id='33333333-3333-4333-8333-333333333333';
insert into public.study_group_members(group_id,user_id,group_role,membership_status) values ('11111111-1111-4111-8111-111111111111','cccccccc-cccc-4ccc-8ccc-cccccccccccc','member','active');
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$begin if not public.is_active_administered_study_group_member(auth.uid(),'33333333-3333-4333-8333-333333333333') then raise exception 'active member denied'; end if; end$$;
set local role postgres;
update public.study_group_members set membership_status='inactive' where user_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
set local role authenticated;
do $$begin if public.is_active_administered_study_group_member(auth.uid(),'33333333-3333-4333-8333-333333333333') then raise exception 'inactive member admitted'; end if; end$$;
set local role postgres;
update public.study_group_members set membership_status='active' where user_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
update public.study_groups set status='archived' where id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
do $$begin if public.is_active_administered_study_group_member(auth.uid(),'33333333-3333-4333-8333-333333333333') then raise exception 'archived group admitted'; end if; end$$;
set local role postgres;
update public.study_groups set status='active' where id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$begin if public.is_active_administered_study_group_member(auth.uid(),'33333333-3333-4333-8333-333333333333') then raise exception 'outsider admitted'; end if; end$$;
rollback;
select 'PASS: group membership positive and outsider negative';
