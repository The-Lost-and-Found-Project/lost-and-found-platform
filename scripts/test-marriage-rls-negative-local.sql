\set ON_ERROR_STOP on
begin;
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,created_at,updated_at)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000000','authenticated','authenticated','participant1-negative@test.invalid','',now(),now()),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000000','authenticated','authenticated','participant2-negative@test.invalid','',now(),now()),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','00000000-0000-0000-0000-000000000000','authenticated','authenticated','mentor-negative@test.invalid','',now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into public.marriage_journey_progress(user_id,session_number,private_reflection) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,'PRIVATE');
insert into public.marriage_mentor_shares(participant_id,mentor_id,share_progress,share_commitments) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true,false);
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$ begin
 begin
  insert into public.marriage_journey_progress(user_id,session_number,private_reflection) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',2,'INVALID');
  raise exception 'ownership violation';
 exception when check_violation or insufficient_privilege then null;
 end;
 begin
  insert into public.marriage_mentor_shares(participant_id,mentor_id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  raise exception 'consent violation';
 exception when check_violation or insufficient_privilege then null;
 end;
end $$;
rollback;
select 'PASS: unauthorized ownership writes rejected';
