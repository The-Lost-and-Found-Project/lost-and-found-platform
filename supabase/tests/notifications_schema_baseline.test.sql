begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

select has_table('public','notifications','fresh migrations include notification table');
select ok((select relrowsecurity from pg_class where oid='public.notifications'::regclass),
 'notification records require RLS');
select ok(has_table_privilege('authenticated','public.notifications','SELECT'),
 'member can reach own notification RLS');
select ok(has_column_privilege('authenticated','public.notifications','read_at','UPDATE'),
 'member can mark own notification read');
select ok(not has_table_privilege('authenticated','public.notifications','INSERT'),
 'ordinary members cannot create forged notifications');
select ok(not has_table_privilege('anon','public.notifications','SELECT'),
 'anonymous user cannot read notification rows');
select ok(has_table_privilege('service_role','public.notifications','INSERT'),
 'trusted background service can insert notification rows');
select ok(has_table_privilege('service_role','public.notifications','UPDATE'),
 'trusted push service can track delivery status');
select has_column('public','notifications','push_status','push status present');
select has_column('public','notifications','push_error','push diagnostics present');
select has_index('public','notifications','notifications_push_attention_idx',
 'pending push index present');
select has_index('public','notifications','notifications_unique_community_reaction',
 'community reaction deduplication index present');

insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at) values
 ('00000000-0000-4000-8000-000000000e11','00000000-0000-0000-0000-000000000000','authenticated','authenticated','notice-a@example.test',now(),now()),
 ('00000000-0000-4000-8000-000000000e12','00000000-0000-0000-0000-000000000000','authenticated','authenticated','notice-b@example.test',now(),now());
insert into public.notifications(user_id,type,title) values
 ('00000000-0000-4000-8000-000000000e11','test','A notification'),
 ('00000000-0000-4000-8000-000000000e12','test','B notification');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000e11',true);
set local role authenticated;
select is((select count(*)::integer from public.notifications),1,
 'members see only their own notifications');
reset role;

select * from finish();
rollback;
