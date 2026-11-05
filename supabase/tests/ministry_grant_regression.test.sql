begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

select ok(has_table_privilege('authenticated','public.ministry_content','SELECT'),
 'members can reach ministry content RLS');
select ok(has_table_privilege('authenticated','public.ministry_memberships','SELECT'),
 'members can reach own ministry membership RLS');
select ok(has_table_privilege('authenticated','public.bible_studies','SELECT'),
 'members can reach published study RLS');
select ok(has_table_privilege('authenticated','public.study_sessions','SELECT'),
 'members can reach assigned study session RLS');
select ok(has_table_privilege('authenticated','public.study_session_participants','SELECT'),
 'members can reach own study assignment RLS');

select ok(not has_table_privilege('anon','public.ministry_content','SELECT'),
 'anonymous visitors are not granted direct ministry table SELECT');
select ok(not has_table_privilege('anon','public.ministry_memberships','SELECT'),
 'anonymous visitors cannot enumerate ministry memberships');
select ok(not has_table_privilege('anon','public.bible_studies','SELECT'),
 'anonymous visitors do not inherit private study SELECT');
select ok(not has_table_privilege('anon','public.study_sessions','SELECT'),
 'anonymous visitors cannot enumerate study sessions');
select ok(not has_table_privilege('anon','public.study_session_participants','SELECT'),
 'anonymous visitors cannot enumerate study assignments');

select ok(has_table_privilege('authenticated','public.ministry_memberships','INSERT'),
 'signed-in members can reach self-join RLS');
select ok(has_table_privilege('authenticated','public.ministry_memberships','DELETE'),
 'signed-in members can reach self-leave RLS');
select ok(has_table_privilege('authenticated','public.ministry_content','INSERT'),
 'scoped leaders can reach write RLS');
select ok((select bool_and(c.relrowsecurity) from pg_class c where c.oid = any(array[
 'public.ministry_content'::regclass,
 'public.ministry_memberships'::regclass,
 'public.bible_studies'::regclass,
 'public.study_sessions'::regclass,
 'public.study_session_participants'::regclass
 ])), 'all five ministry and study tables remain protected by RLS');

select * from finish();
rollback;
