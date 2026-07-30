begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

create function public.is_care_team()
returns boolean
language sql
security definer
as $$ select false; $$;

create function public.get_quiz_questions(text, integer)
returns setof text
language sql
as $$ select null::text where false; $$;

create function public.reassign_prayer_request(uuid, uuid)
returns uuid
language sql
security definer
as $$ select null::uuid; $$;

create function public.archive_stale_prayer_requests()
returns integer
language sql
security definer
as $$ select 0; $$;

create function public.mark_welcome_email_sent(text)
returns boolean
language sql
security definer
as $$ select false; $$;

grant execute on all functions in schema public to public, anon, authenticated, service_role;

revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
grant execute on function public.is_care_team() to anon, authenticated;
grant execute on function public.get_quiz_questions(text, integer) to authenticated;

select ok(
  has_function_privilege('anon', 'public.is_care_team()', 'EXECUTE'),
  'anonymous RLS checks can call is_care_team'
);

select ok(
  has_function_privilege('authenticated', 'public.is_care_team()', 'EXECUTE'),
  'authenticated RLS checks can call is_care_team'
);

select ok(
  not has_function_privilege('anon', 'public.get_quiz_questions(text,integer)', 'EXECUTE'),
  'anonymous users cannot load member trivia questions'
);

select ok(
  has_function_privilege('authenticated', 'public.get_quiz_questions(text,integer)', 'EXECUTE'),
  'authenticated members can load trivia questions'
);

select ok(
  not has_function_privilege('anon', 'public.reassign_prayer_request(uuid,uuid)', 'EXECUTE'),
  'anonymous users cannot reassign prayer requests'
);

select ok(
  not has_function_privilege('authenticated', 'public.reassign_prayer_request(uuid,uuid)', 'EXECUTE'),
  'authenticated users cannot reassign prayer requests directly'
);

select ok(
  not has_function_privilege('authenticated', 'public.archive_stale_prayer_requests()', 'EXECUTE'),
  'authenticated users cannot archive prayer requests directly'
);

select ok(
  not has_function_privilege('authenticated', 'public.mark_welcome_email_sent(text)', 'EXECUTE'),
  'authenticated users cannot mark welcome emails as sent'
);

select ok(
  has_function_privilege('service_role', 'public.reassign_prayer_request(uuid,uuid)', 'EXECUTE'),
  'trusted server routes retain maintenance function access'
);

create function public.future_server_only_function()
returns boolean
language sql
as $$ select true; $$;

select ok(
  not has_function_privilege('authenticated', 'public.future_server_only_function()', 'EXECUTE'),
  'new functions are private by default'
);

select * from finish();
rollback;
