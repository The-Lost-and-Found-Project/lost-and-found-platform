\set ON_ERROR_STOP on
begin;
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,created_at,updated_at)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner-mentor-test@test.invalid','',now(),now()),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','00000000-0000-0000-0000-000000000000','authenticated','authenticated','mentor-write-test@test.invalid','',now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into public.marriage_mentor_shares(participant_id,mentor_id,share_progress,share_commitments) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true,false);
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$ begin
 begin
  insert into public.marriage_mentor_updates(participant_id,mentor_id,session_number,completed,commitment)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc',1,true,'');
  raise exception 'mentor update insert unexpectedly succeeded';
 exception when check_violation or insufficient_privilege then null;
 end;
end $$;
update public.marriage_mentor_shares set share_commitments=true where participant_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ begin
 if (select share_commitments from public.marriage_mentor_shares where participant_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then raise exception 'mentor changed consent'; end if;
end $$;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$ begin
 begin
  insert into public.marriage_mentor_updates(participant_id,mentor_id,session_number,completed,commitment)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc',2,true,'NOT CONSENTED');
  raise exception 'disabled commitment sharing unexpectedly succeeded';
 exception when check_violation or insufficient_privilege then null;
 end;
end $$;
rollback;
select 'PASS: mentor writes and disabled commitment sharing rejected';
