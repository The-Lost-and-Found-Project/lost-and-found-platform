\set ON_ERROR_STOP on
begin;
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,created_at,updated_at)
values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000000','authenticated','authenticated','participant1@test.invalid','',now(),now()),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000000','authenticated','authenticated','participant2@test.invalid','',now(),now()),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','00000000-0000-0000-0000-000000000000','authenticated','authenticated','mentor@test.invalid','',now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into public.marriage_journey_progress(user_id,session_number,private_reflection,shared_commitment,completed_at)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,'SECRET JOURNAL','Public practice',now());
do $$ begin
 if (select count(*) from public.marriage_journey_progress) <> 1 then raise exception 'participant cannot see own journal'; end if;
end $$;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$ begin
 if (select count(*) from public.marriage_journey_progress) <> 0 then raise exception 'another participant can see journal'; end if;
end $$;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$ begin
 if (select count(*) from public.marriage_journey_progress) <> 0 then raise exception 'mentor can see private journal'; end if;
end $$;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into public.marriage_mentor_shares(participant_id,mentor_id,share_progress,share_commitments)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true,true);
insert into public.marriage_mentor_updates(participant_id,mentor_id,session_number,completed,commitment)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc',1,true,'Public practice');

select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$ begin
 if (select count(*) from public.marriage_mentor_updates) <> 1 then raise exception 'mentor cannot see shared update'; end if;
 if (select count(*) from public.marriage_journey_progress) <> 0 then raise exception 'mentor can see private journal after grant'; end if;
end $$;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$ begin
 if (select count(*) from public.marriage_mentor_updates) <> 0 then raise exception 'unrelated user can see shared update'; end if;
end $$;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
update public.marriage_mentor_shares set share_commitments=false where mentor_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
do $$ begin
 if (select count(*) from public.marriage_mentor_updates) <> 0 then raise exception 'old commitment snapshot survived permission reduction'; end if;
end $$;
insert into public.marriage_mentor_updates(participant_id,mentor_id,session_number,completed,commitment)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc',1,true,'');
delete from public.marriage_mentor_shares where mentor_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
do $$ begin
 if (select count(*) from public.marriage_mentor_updates) <> 0 then raise exception 'shared update survived revocation'; end if;
end $$;
rollback;
select 'PASS: local marriage RLS ownership, mentor sharing, consent reduction and revocation';
