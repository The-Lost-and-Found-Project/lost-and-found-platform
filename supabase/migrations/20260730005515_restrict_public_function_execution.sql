-- Restore the hosted function-execution lockdown in clean repository replays.
-- Production already records this version with the same revokes and grants;
-- guard the grants so fresh databases can replay before legacy helpers exist.
revoke execute on all functions in schema public from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

do $migration$
begin
  if to_regprocedure('public.is_care_team()') is not null then
    execute 'grant execute on function public.is_care_team() to anon, authenticated';
  end if;

  if to_regprocedure('public.get_quiz_questions(text, integer)') is not null then
    execute 'grant execute on function public.get_quiz_questions(text, integer) to authenticated';
  end if;
end
$migration$;
