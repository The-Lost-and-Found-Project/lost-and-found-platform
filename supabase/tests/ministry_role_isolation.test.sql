begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- Synthetic users and ministry records exist only inside this rolled-back test.
insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at)
values
('00000000-0000-4000-8000-000000000a11','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ministry-member-a@example.test',now(),now()),
('00000000-0000-4000-8000-000000000a12','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ministry-member-b@example.test',now(),now()),
('00000000-0000-4000-8000-000000000a13','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ministry-admin@example.test',now(),now());

update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000000a13';
insert into public.ministry_memberships(ministry_slug,user_id,membership_role)
values ('hearth','00000000-0000-4000-8000-000000000a11','member'),
       ('foundry','00000000-0000-4000-8000-000000000a12','leader');
insert into public.ministry_content(ministry_slug,content_type,title,is_published)
values ('hearth','resource','published test resource',true),
       ('hearth','resource','unpublished test resource',false);

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000a11',true);
set local role authenticated;
select is((select count(*)::integer from public.ministry_memberships),1,
 'member sees only own membership');
select is((select count(*)::integer from public.ministry_content),1,
 'member sees published but not unpublished ministry content');
select throws_ok($$insert into public.ministry_memberships(ministry_slug,user_id,membership_role)
 values ('mens-study','00000000-0000-4000-8000-000000000a11','leader')$$,
 '42501',null,'member cannot promote self to leader');
select throws_ok($$insert into public.ministry_memberships(ministry_slug,user_id,membership_role)
 values ('mens-study','00000000-0000-4000-8000-000000000a12','member')$$,
 '42501',null,'member cannot join another user');
select throws_ok($$insert into public.ministry_content(ministry_slug,content_type,title,is_published)
 values ('hearth','resource','member private draft',false)$$,
 '42501',null,'ordinary member cannot publish private content');
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000a12',true);
set local role authenticated;
select is((select count(*)::integer from public.ministry_memberships),1,
 'leader sees own membership, not other rosters');
select lives_ok($$insert into public.ministry_content(ministry_slug,content_type,title,is_published)
 values ('foundry','resource','leader-scoped resource',false)$$,
 'scoped leader can create content in own ministry');
select throws_ok($$insert into public.ministry_content(ministry_slug,content_type,title,is_published)
 values ('hearth','resource','cross-ministry resource',false)$$,
 '42501',null,'leader cannot publish in unrelated ministry');
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000a13',true);
set local role authenticated;
select is((select count(*)::integer from public.ministry_memberships),2,
 'admin sees memberships across ministries');
select lives_ok($$insert into public.ministry_memberships(ministry_slug,user_id,membership_role)
 values ('mens-study','00000000-0000-4000-8000-000000000a11','leader')$$,
 'admin can assign a leader');
select is((select count(*)::integer from public.ministry_content),4,
 'admin sees both published and unpublished resources');
reset role;

select * from finish();
rollback;
