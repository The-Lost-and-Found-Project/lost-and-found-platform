-- Auth helpers are used by signed-in RLS policies with auth.uid() as UID.
-- Never allow public callers to enumerate another person's role or activity.
-- Keep SECURITY DEFINER to avoid recursive policy lookups, and pin search_path.

create or replace function public.is_lfp_admin(uid uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $body$
 select uid = (select auth.uid()) and exists(
   select 1 from public.profiles p where p.id = uid and p.role = 'admin'
 );
$body$;

create or replace function public.is_study_group_facilitator(uid uuid,gid uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $body$
 select uid = (select auth.uid()) and exists(
   select 1 from public.study_group_members gm
   where gm.group_id = gid and gm.user_id = uid
     and gm.group_role = 'facilitator' and gm.membership_status = 'active'
 );
$body$;

create or replace function public.has_locked_group_response(uid uuid,sid uuid,dnum integer)
returns boolean
language sql stable security definer
set search_path = ''
as $body$
 select uid = (select auth.uid()) and exists(
   select 1 from public.study_daily_responses r
   where r.study_session_id = sid and r.user_id = uid
     and r.day_number = dnum and r.response_type = 'group_response'
     and r.locked_at is not null
 );
$body$;

revoke all on function public.is_lfp_admin(uuid) from public, anon;
revoke all on function public.is_study_group_facilitator(uuid,uuid) from public, anon;
revoke all on function public.has_locked_group_response(uuid,uuid,integer) from public, anon;
grant execute on function public.is_lfp_admin(uuid) to authenticated,service_role;
grant execute on function public.is_study_group_facilitator(uuid,uuid) to authenticated,service_role;
grant execute on function public.has_locked_group_response(uuid,uuid,integer) to authenticated,service_role;
