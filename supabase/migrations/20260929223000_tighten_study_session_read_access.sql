-- A scheduled study session is an assigned gathering, not public study metadata.
-- Members may read only their own assigned sessions. Facilitators/admin access
-- uses the server-side scoped management paths already enforced by the app.
drop policy if exists "members read scheduled study sessions" on public.study_sessions;

create policy "participants read assigned study sessions"
  on public.study_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.study_session_participants sp
      where sp.study_session_id = study_sessions.id
        and sp.user_id = auth.uid()
    )
    or facilitator_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
