begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at)
values
 ('00000000-0000-4000-8000-000000000f31','00000000-0000-0000-0000-000000000000','authenticated','authenticated','auth-leader@example.test',now(),now()),
 ('00000000-0000-4000-8000-000000000f32','00000000-0000-0000-0000-000000000000','authenticated','authenticated','auth-member@example.test',now(),now()),
 ('00000000-0000-4000-8000-000000000f33','00000000-0000-0000-0000-000000000000','authenticated','authenticated','auth-follower@example.test',now(),now());
insert into public.ministry_memberships(ministry_slug,user_id,membership_role) values
 ('hearth','00000000-0000-4000-8000-000000000f31','leader'),
 ('hearth','00000000-0000-4000-8000-000000000f32','member'),
 ('hearth','00000000-0000-4000-8000-000000000f33','member');
insert into public.ministry_content(id,ministry_slug,content_type,title,is_published) values
 ('00000000-0000-4000-8000-000000000f41','hearth','announcement','Synthetic leader publication',false),
 ('00000000-0000-4000-8000-000000000f42','hearth','resource','Synthetic members cannot publish',false),
 ('00000000-0000-4000-8000-000000000f43','foundry','resource','Synthetic cross-ministry check',false);

select is((select count(*)::int from public.notifications where type='ministry_update'),0,
 'creating unpublished synthetic content produces no notification');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000f31',true);
set local role authenticated;
select lives_ok($stmt$update public.ministry_content set is_published=true
 where id='00000000-0000-4000-8000-000000000f41'$stmt$,
 'scoped authenticated ministry leader can publish');
select is((select count(*)::int from public.ministry_content where id='00000000-0000-4000-8000-000000000f41' and is_published),1,
 'scoped leader publication persists');
select lives_ok($stmt$update public.ministry_content set is_published=true
 where id='00000000-0000-4000-8000-000000000f43'$stmt$,
 'leader cannot see or modify other ministry draft');
reset role;
select is((select count(*)::int from public.notifications where type='ministry_update'),3,
 'authenticated leader publication queues only its three ministry followers');
select is((select count(*)::int from public.ministry_content where id='00000000-0000-4000-8000-000000000f43' and is_published),0,
 'cross-ministry leader update did not publish');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000f32',true);
set local role authenticated;
select lives_ok($stmt$update public.ministry_content set is_published=true
 where id='00000000-0000-4000-8000-000000000f42'$stmt$,
 'ordinary member cannot use update to publish a ministry draft');
reset role;
select is((select count(*)::int from public.ministry_content where id='00000000-0000-4000-8000-000000000f42' and is_published),0,
 'ordinary member update leaves draft unpublished');
select is((select count(*)::int from public.notifications where type='ministry_update'),3,
 'unauthorized publication attempts do not create follower notices');

select * from finish();
rollback;
