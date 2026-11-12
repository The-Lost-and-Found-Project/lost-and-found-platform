-- RLS helpers must never disclose another user's authorization or study status.
-- Preserve signatures and the existing RLS policy call sites.
create or replace function public.is_lfp_admin(uid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select uid=(select auth.uid()) and exists (
 select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin' and p.is_active=true);
$$;
create or replace function public.is_study_group_facilitator(uid uuid,gid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select uid=(select auth.uid()) and exists (
 select 1 from public.study_group_members gm where gm.group_id=gid and gm.user_id=(select auth.uid())
 and gm.group_role='facilitator' and gm.membership_status='active');
$$;
create or replace function public.has_locked_group_response(uid uuid,sid uuid,dnum integer) returns boolean
language sql stable security definer set search_path='' as $$
 select uid=(select auth.uid()) and exists (
 select 1 from public.study_daily_responses r where r.study_session_id=sid and r.user_id=(select auth.uid())
 and r.day_number=dnum and r.response_type='group_response' and r.locked_at is not null);
$$;
create or replace function public.is_daily_path_day_unlocked(uid uuid,sid uuid,dnum integer) returns boolean
language sql stable security definer set search_path='' as $$
 select uid=(select auth.uid()) and exists (
 select 1 from public.study_sessions ss
 join public.study_session_participants sp on sp.study_session_id=ss.id and sp.user_id=(select auth.uid())
 join public.bible_studies bs on bs.id=ss.bible_study_id
 where ss.id=sid and dnum between 1 and 31 and ss.daily_path_released_at is not null
 and now()>=ss.daily_path_released_at and jsonb_typeof(bs.devotional_cards)='array'
 and dnum<=jsonb_array_length(bs.devotional_cards)
 and dnum<=least(jsonb_array_length(bs.devotional_cards),greatest(1,floor(extract(epoch from (now()-ss.daily_path_released_at))/86400)::integer+1)));
$$;
revoke all on function public.is_lfp_admin(uuid),public.is_study_group_facilitator(uuid,uuid),public.has_locked_group_response(uuid,uuid,integer),public.is_daily_path_day_unlocked(uuid,uuid,integer) from public,anon;
grant execute on function public.is_lfp_admin(uuid),public.is_study_group_facilitator(uuid,uuid),public.has_locked_group_response(uuid,uuid,integer),public.is_daily_path_day_unlocked(uuid,uuid,integer) to authenticated;
