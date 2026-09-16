-- Private Daily Path writing is literally owner-only at the database layer.
-- Facilitators/admins may see only locked group_response rows, never private_journal
-- or personal_reflection rows belonging to another member.
drop policy if exists "participants read own or revealed group responses" on public.study_daily_responses;
create policy "participants read own or revealed group responses" on public.study_daily_responses
for select to authenticated using (
  user_id=auth.uid()
  or (
    response_type='group_response'
    and locked_at is not null
    and (
      (
        exists(select 1 from public.study_session_participants me where me.study_session_id=study_daily_responses.study_session_id and me.user_id=auth.uid())
        and public.has_locked_group_response(auth.uid(),study_session_id,day_number)
      )
      or exists(select 1 from public.study_sessions ss where ss.id=study_daily_responses.study_session_id and ss.facilitator_user_id=auth.uid())
      or public.is_lfp_admin(auth.uid())
    )
  )
);
