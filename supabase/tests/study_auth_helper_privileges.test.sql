begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select ok(not has_function_privilege('anon','public.is_lfp_admin(uuid)','EXECUTE'),
 'anonymous role cannot probe another user's admin status');
select ok(not has_function_privilege('anon','public.is_study_group_facilitator(uuid,uuid)','EXECUTE'),
 'anonymous role cannot probe facilitator membership');
select ok(not has_function_privilege('anon','public.has_locked_group_response(uuid,uuid,integer)','EXECUTE'),
 'anonymous role cannot probe response lock status');
select ok(has_function_privilege('authenticated','public.is_lfp_admin(uuid)','EXECUTE'),
 'signed-in RLS can call admin helper');
select ok(has_function_privilege('authenticated','public.is_study_group_facilitator(uuid,uuid)','EXECUTE'),
 'signed-in RLS can call facilitator helper');
select ok(has_function_privilege('authenticated','public.has_locked_group_response(uuid,uuid,integer)','EXECUTE'),
 'signed-in RLS can call locked-response helper');

insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at)
values
('00000000-0000-4000-8000-000000000d11','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rpc-owner@example.test',now(),now()),
('00000000-0000-4000-8000-000000000d12','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rpc-other@example.test',now(),now());
update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000000d12';

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000d11',true);
set local role authenticated;
select ok(not public.is_lfp_admin('00000000-0000-4000-8000-000000000d12'),
 'member cannot ask definer helper if another account is an admin');
select ok(not public.is_study_group_facilitator('00000000-0000-4000-8000-000000000d12','00000000-0000-4000-8000-000000000d20'),
 'member cannot probe another account facilitator status');
select ok(not public.has_locked_group_response('00000000-0000-4000-8000-000000000d12','00000000-0000-4000-8000-000000000d21',1),
 'member cannot probe another account group response status');
reset role;
select * from finish();
rollback;
