begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

select ok(has_column_privilege('authenticated','public.notifications','read_at','UPDATE'),
 'authenticated members may acknowledge their notifications');
select ok(not has_column_privilege('authenticated','public.notifications','push_status','UPDATE'),
 'members cannot forge push-delivery status');
select ok(not has_column_privilege('authenticated','public.notifications','title','UPDATE'),
 'members cannot rewrite notification title');
select ok(not has_column_privilege('authenticated','public.notifications','body','UPDATE'),
 'members cannot rewrite notification body');
select ok(not has_column_privilege('authenticated','public.notifications','user_id','UPDATE'),
 'members cannot reassign notification ownership');
select ok(has_table_privilege('service_role','public.notifications','UPDATE'),
 'trusted push worker retains update access');

insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at)
values
 ('00000000-0000-4000-8000-000000000e31','00000000-0000-0000-0000-000000000000','authenticated','authenticated','notice-restrict-a@example.test',now(),now()),
 ('00000000-0000-4000-8000-000000000e32','00000000-0000-0000-0000-000000000000','authenticated','authenticated','notice-restrict-b@example.test',now(),now());
insert into public.notifications(user_id,type,title) values
 ('00000000-0000-4000-8000-000000000e31','test','Own notice'),
 ('00000000-0000-4000-8000-000000000e32','test','Another member notice');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000e31',true);
set local role authenticated;
select lives_ok($stmt$update public.notifications set read_at=now() where user_id='00000000-0000-4000-8000-000000000e31'$stmt$,'member may mark own notice read');
select is((select count(*)::integer from public.notifications where user_id='00000000-0000-4000-8000-000000000e31' and read_at is not null),1,
 'own notification read receipt was saved');
select throws_ok($stmt$update public.notifications set push_status='sent' where user_id='00000000-0000-4000-8000-000000000e31'$stmt$,
 '42501',null,'member cannot falsify push delivery');
select throws_ok($$update public.notifications set title='forged' where user_id='00000000-0000-4000-8000-000000000e31'$$,
 '42501',null,'member cannot tamper with notification content');
select lives_ok($stmt$update public.notifications set read_at=now() where user_id='00000000-0000-4000-8000-000000000e32'$stmt$,
 'attempt to mark another member notification read does not disclose row or throw');
select is((select count(*)::integer from public.notifications where user_id='00000000-0000-4000-8000-000000000e32' and read_at is not null),0,
 'cross-member UPDATE cannot mark another person notification read');
select is((select count(*)::integer from public.notifications where user_id='00000000-0000-4000-8000-000000000e31' and read_at is not null),1,
 'own read receipt survives attempted cross-member update');
reset role;

select * from finish();
rollback;
