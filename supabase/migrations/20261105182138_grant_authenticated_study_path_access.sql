-- Make existing, restrictive study and Daily Path RLS policies reachable.
-- No anonymous data access; no broader row permissions.
do $migration$
declare name text;
begin
 foreach name in array array['study_groups','study_group_members','study_daily_progress','study_daily_responses'] loop
  if to_regclass(format('public.%I',name)) is not null then
   execute format('revoke all on table public.%I from public, anon',name);
   execute format('grant select on table public.%I to authenticated',name);
  end if;
 end loop;
 if to_regclass('public.study_groups') is not null then
  grant insert, update, delete on table public.study_groups to authenticated;
 end if;
 if to_regclass('public.study_group_members') is not null then
  grant insert, update, delete on table public.study_group_members to authenticated;
 end if;
 if to_regclass('public.study_daily_progress') is not null then
  grant insert, update, delete on table public.study_daily_progress to authenticated;
 end if;
 if to_regclass('public.study_daily_responses') is not null then
  revoke delete on table public.study_daily_responses from authenticated;
  grant insert, update on table public.study_daily_responses to authenticated;
 end if;
end;
$migration$;
