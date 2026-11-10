begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at) values
 ('00000000-0000-4000-8000-000000000f11','00000000-0000-0000-0000-000000000000','authenticated','authenticated','atomic-hearth-a@example.test',now(),now()),
 ('00000000-0000-4000-8000-000000000f12','00000000-0000-0000-0000-000000000000','authenticated','authenticated','atomic-hearth-b@example.test',now(),now()),
 ('00000000-0000-4000-8000-000000000f13','00000000-0000-0000-0000-000000000000','authenticated','authenticated','atomic-foundry@example.test',now(),now());
insert into public.ministry_memberships(ministry_slug,user_id,membership_role) values
 ('hearth','00000000-0000-4000-8000-000000000f11','member'),
 ('hearth','00000000-0000-4000-8000-000000000f12','member'),
 ('foundry','00000000-0000-4000-8000-000000000f13','member');

insert into public.ministry_content(id,ministry_slug,content_type,title,is_published)
values ('00000000-0000-4000-8000-000000000f21','hearth','announcement','Unpublished teaching',false);
select is((select count(*)::int from public.notifications where user_id in
 ('00000000-0000-4000-8000-000000000f11','00000000-0000-4000-8000-000000000f12')),0,
 'draft creation does not notify anyone');

update public.ministry_content set is_published=true where id='00000000-0000-4000-8000-000000000f21';
select is((select count(*)::int from public.notifications where type='ministry_update'),2,
 'publishing delivers one pending notification to each follower');
select is((select count(*)::int from public.notifications where user_id='00000000-0000-4000-8000-000000000f13'),0,
 'other ministry members are never notified');
select is((select count(*)::int from public.notifications where push_status='pending' and type='ministry_update'),2,
 'existing push delivery cron receives pending notification records');

update public.ministry_content set is_published=true,title='Updated title'
 where id='00000000-0000-4000-8000-000000000f21';
select is((select count(*)::int from public.notifications where type='ministry_update'),2,
 'repeat published updates do not cause duplicate fanout');
update public.ministry_content set title='More details'
 where id='00000000-0000-4000-8000-000000000f21';
select is((select count(*)::int from public.notifications where type='ministry_update'),2,
 'ordinary content edit does not repeat fanout');

insert into public.ministry_content(id,ministry_slug,content_type,title,is_published)
values ('00000000-0000-4000-8000-000000000f22','hearth','resource','Immediately published',true);
select is((select count(*)::int from public.notifications where type='ministry_update'),4,
 'immediately published insert notifies each follower');

update public.ministry_content set is_published=false where id='00000000-0000-4000-8000-000000000f21';
select is((select count(*)::int from public.notifications where type='ministry_update'),4,
 'unpublishing does not send another notification');
update public.ministry_content set is_published=true where id='00000000-0000-4000-8000-000000000f21';
select is((select count(*)::int from public.notifications where type='ministry_update'),6,
 'deliberate republishing is treated as a new publication event');

select ok(not has_schema_privilege('anon','ministry_internal','USAGE'),
 'private trigger schema not exposed to anonymous users');
select ok(not has_schema_privilege('authenticated','ministry_internal','USAGE'),
 'private trigger schema not exposed to signed-in clients');

create or replace function pg_temp.fail_ministry_notification() returns trigger
language plpgsql as $fail$ begin
  if new.type='ministry_update' then raise exception 'Synthetic notification insert failed'; end if;
  return new;
end $fail$;
create trigger synthetic_notification_failure before insert on public.notifications
for each row execute function pg_temp.fail_ministry_notification();
select throws_ok($$insert into public.ministry_content(id,ministry_slug,content_type,title,is_published)
 values ('00000000-0000-4000-8000-000000000f23','hearth','resource','Rollback example',true)$$,
 'P0001', 'Synthetic notification insert failed',
 'notification insertion failure rolls back the publication transaction');
drop trigger synthetic_notification_failure on public.notifications;
select is((select count(*)::int from public.ministry_content where id='00000000-0000-4000-8000-000000000f23'),0,
 'failed fanout leaves no published content behind');

select * from finish();
rollback;
