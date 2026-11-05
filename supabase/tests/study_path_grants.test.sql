begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

select ok(has_table_privilege('authenticated','public.study_groups','SELECT'),'signed-in members can reach group RLS');
select ok(has_table_privilege('authenticated','public.study_group_members','SELECT'),'signed-in members can reach group membership RLS');
select ok(has_table_privilege('authenticated','public.study_daily_progress','SELECT'),'participants can see own daily progress');
select ok(has_table_privilege('authenticated','public.study_daily_responses','SELECT'),'participants can see permitted responses');

select ok(has_table_privilege('authenticated','public.study_groups','INSERT'),'admins can create groups subject to RLS');
select ok(has_table_privilege('authenticated','public.study_group_members','INSERT'),'admins can assign group members subject to RLS');
select ok(has_table_privilege('authenticated','public.study_daily_progress','INSERT'),'participants can create own daily progress subject to RLS');
select ok(has_table_privilege('authenticated','public.study_daily_progress','UPDATE'),'participants can update own daily progress subject to RLS');
select ok(has_table_privilege('authenticated','public.study_daily_responses','INSERT'),'participants can create own responses subject to RLS');
select ok(has_table_privilege('authenticated','public.study_daily_responses','UPDATE'),'participants can edit own unlocked responses subject to RLS');
select ok(not has_table_privilege('authenticated','public.study_daily_responses','DELETE'),'ordinary sessions are not granted response deletion');

select ok(not has_table_privilege('anon','public.study_groups','SELECT'),'anonymous visitors cannot enumerate groups');
select ok(not has_table_privilege('anon','public.study_group_members','SELECT'),'anonymous visitors cannot enumerate group members');
select ok(not has_table_privilege('anon','public.study_daily_progress','SELECT'),'anonymous visitors cannot inspect daily progress');
select ok(not has_table_privilege('anon','public.study_daily_responses','SELECT'),'anonymous visitors cannot inspect private responses');
select ok((select bool_and(relrowsecurity) from pg_class where oid=any(array[
'public.study_groups'::regclass,
'public.study_group_members'::regclass,
'public.study_daily_progress'::regclass,
'public.study_daily_responses'::regclass])), 'all study tables retain RLS');
select * from finish();
rollback;
