-- Enforce Daily Path release timing at the database boundary, not only in the UI.
create or replace function public.is_daily_path_day_unlocked(uid uuid, sid uuid, dnum integer)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1
    from public.study_sessions ss
    join public.study_session_participants sp
      on sp.study_session_id=ss.id and sp.user_id=uid
    join public.bible_studies bs
      on bs.id=ss.bible_study_id
    where ss.id=sid
      and dnum between 1 and 31
      and ss.daily_path_released_at is not null
      and now() >= ss.daily_path_released_at
      and jsonb_typeof(bs.devotional_cards)='array'
      and dnum <= jsonb_array_length(bs.devotional_cards)
      and dnum <= least(
        jsonb_array_length(bs.devotional_cards),
        greatest(
          1,
          floor(extract(epoch from (now()-ss.daily_path_released_at))/86400)::integer + 1
        )
      )
  );
$$;

drop policy if exists "participants manage own daily progress" on public.study_daily_progress;
create policy "participants manage own unlocked daily progress"
on public.study_daily_progress
for all to authenticated
using (
  user_id=auth.uid()
  and public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
)
with check (
  user_id=auth.uid()
  and public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
);

drop policy if exists "participants insert own daily responses" on public.study_daily_responses;
create policy "participants insert own unlocked daily responses"
on public.study_daily_responses
for insert to authenticated
with check (
  user_id=auth.uid()
  and public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
);

drop policy if exists "participants update own unlocked responses" on public.study_daily_responses;
create policy "participants update own unlocked responses"
on public.study_daily_responses
for update to authenticated
using (
  user_id=auth.uid()
  and public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
)
with check (
  user_id=auth.uid()
  and public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
);

drop policy if exists "participants read own or revealed group responses" on public.study_daily_responses;
create policy "participants read unlocked own or revealed group responses"
on public.study_daily_responses
for select to authenticated
using (
  (
    user_id=auth.uid()
    and public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
  )
  or (
    response_type='group_response'
    and locked_at is not null
    and (
      (
        public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
        and public.has_locked_group_response(auth.uid(),study_session_id,day_number)
      )
      or exists(
        select 1 from public.study_sessions ss
        where ss.id=study_daily_responses.study_session_id
          and ss.facilitator_user_id=auth.uid()
      )
      or public.is_lfp_admin(auth.uid())
    )
  )
);
