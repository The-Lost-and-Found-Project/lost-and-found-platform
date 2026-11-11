-- Group discussion is permitted only in active, facilitator-administered groups.
-- SECURITY DEFINER reads membership without recursive policy evaluation; no private answers are returned.
create or replace function public.is_active_administered_study_group_member(uid uuid, sid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists (
  select 1 from public.study_sessions ss
  join public.study_groups g on g.id=ss.group_id and g.status='active'
  join public.study_group_members gm on gm.group_id=g.id and gm.user_id=uid and gm.membership_status='active'
  join public.study_session_participants sp on sp.study_session_id=ss.id and sp.user_id=uid
  where ss.id=sid and ss.facilitator_user_id is not null
    and exists (select 1 from public.study_group_members leader
      where leader.group_id=g.id and leader.user_id=ss.facilitator_user_id
        and leader.group_role='facilitator' and leader.membership_status='active')
 );
$$;
revoke all on function public.is_active_administered_study_group_member(uuid,uuid) from public, anon;
grant execute on function public.is_active_administered_study_group_member(uuid,uuid) to authenticated;

drop policy if exists "participants insert own unlocked daily responses" on public.study_daily_responses;
create policy "participants insert own unlocked daily responses" on public.study_daily_responses
for insert to authenticated with check (
 user_id=(select auth.uid())
 and public.is_daily_path_day_unlocked((select auth.uid()),study_session_id,day_number)
 and (response_type <> 'group_response' or public.is_active_administered_study_group_member((select auth.uid()),study_session_id))
);
drop policy if exists "participants update own unlocked responses" on public.study_daily_responses;
create policy "participants update own unlocked responses" on public.study_daily_responses
for update to authenticated
using (user_id=(select auth.uid()) and public.is_daily_path_day_unlocked((select auth.uid()),study_session_id,day_number))
with check (user_id=(select auth.uid()) and public.is_daily_path_day_unlocked((select auth.uid()),study_session_id,day_number)
 and (response_type <> 'group_response' or public.is_active_administered_study_group_member((select auth.uid()),study_session_id)));
drop policy if exists "participants read unlocked own or revealed group responses" on public.study_daily_responses;
create policy "participants read unlocked own or revealed group responses" on public.study_daily_responses
for select to authenticated using (
 (user_id=(select auth.uid()) and public.is_daily_path_day_unlocked((select auth.uid()),study_session_id,day_number))
 or (response_type='group_response' and locked_at is not null
 and public.is_active_administered_study_group_member(user_id,study_session_id)
 and (
  (public.is_active_administered_study_group_member((select auth.uid()),study_session_id)
   and public.is_daily_path_day_unlocked((select auth.uid()),study_session_id,day_number)
   and public.has_locked_group_response((select auth.uid()),study_session_id,day_number))
  or exists(select 1 from public.study_sessions ss where ss.id=study_daily_responses.study_session_id
    and ss.facilitator_user_id=(select auth.uid()) and public.is_active_administered_study_group_member((select auth.uid()),study_session_id))
  or public.is_lfp_admin((select auth.uid()))
 ))
);
