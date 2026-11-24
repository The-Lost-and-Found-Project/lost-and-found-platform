-- Assignment is the prerequisite for all marriage journey access.
create table public.marriage_journey_assignments (
 user_id uuid primary key references auth.users(id) on delete cascade,
 assigned_by uuid not null references auth.users(id),
 assigned_at timestamptz not null default now(),
 revoked_at timestamptz
);
alter table public.marriage_journey_assignments enable row level security;
revoke all on public.marriage_journey_assignments from anon;
grant select on public.marriage_journey_assignments to authenticated;
create policy "Participants read their own assignment" on public.marriage_journey_assignments
 for select to authenticated using ((select auth.uid()) = user_id);
-- Prevent direct table access to unassigned users even with a forged request.
drop policy "Participants read their own marriage progress" on public.marriage_journey_progress;
drop policy "Participants create their own marriage progress" on public.marriage_journey_progress;
drop policy "Participants update their own marriage progress" on public.marriage_journey_progress;
drop policy "Participants delete their own marriage progress" on public.marriage_journey_progress;
create policy "Assigned participants read own progress" on public.marriage_journey_progress for select to authenticated
 using ((select auth.uid())=user_id and exists(select 1 from public.marriage_journey_assignments a where a.user_id=marriage_journey_progress.user_id and a.revoked_at is null));
create policy "Assigned participants create own progress" on public.marriage_journey_progress for insert to authenticated
 with check ((select auth.uid())=user_id and exists(select 1 from public.marriage_journey_assignments a where a.user_id=marriage_journey_progress.user_id and a.revoked_at is null));
create policy "Assigned participants update own progress" on public.marriage_journey_progress for update to authenticated
 using ((select auth.uid())=user_id and exists(select 1 from public.marriage_journey_assignments a where a.user_id=marriage_journey_progress.user_id and a.revoked_at is null))
 with check ((select auth.uid())=user_id and exists(select 1 from public.marriage_journey_assignments a where a.user_id=marriage_journey_progress.user_id and a.revoked_at is null));
create policy "Assigned participants delete own progress" on public.marriage_journey_progress for delete to authenticated
 using ((select auth.uid())=user_id);
-- Existing mentor shares stay revocable, but only currently assigned participants can share.
drop policy "Participant grants access" on public.marriage_mentor_shares;
create policy "Assigned participant grants access" on public.marriage_mentor_shares for insert to authenticated
 with check ((select auth.uid())=participant_id and exists(select 1 from public.marriage_journey_assignments a where a.user_id=participant_id and a.revoked_at is null));
-- Revocation also clears mentor grants and snapshots, preserving private journals.
create function public.clear_marriage_shares_on_unassignment() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 if new.revoked_at is not null and old.revoked_at is null then
   delete from public.marriage_mentor_shares where participant_id=new.user_id;
 end if;
 return new;
end; $$;
revoke all on function public.clear_marriage_shares_on_unassignment() from public, anon, authenticated;
create trigger clear_marriage_shares_on_unassignment after update on public.marriage_journey_assignments
 for each row execute function public.clear_marriage_shares_on_unassignment();
-- Prevent mentors from reading old grants/updates for unassigned participants.
drop policy "Participant or mentor sees grant" on public.marriage_mentor_shares;
create policy "Participant or mentor sees assigned grant" on public.marriage_mentor_shares for select to authenticated
 using (((select auth.uid())=participant_id or (select auth.uid())=mentor_id)
 and exists(select 1 from public.marriage_journey_assignments a where a.user_id=marriage_mentor_shares.participant_id and a.revoked_at is null));
drop policy "Participant or active mentor reads shared updates" on public.marriage_mentor_updates;
create policy "Participant or active mentor reads assigned updates" on public.marriage_mentor_updates for select to authenticated
 using (exists(select 1 from public.marriage_journey_assignments a where a.user_id=marriage_mentor_updates.participant_id and a.revoked_at is null)
 and ((select auth.uid())=participant_id or ((select auth.uid())=mentor_id and exists (
 select 1 from public.marriage_mentor_shares s where s.participant_id=marriage_mentor_updates.participant_id
 and s.mentor_id=marriage_mentor_updates.mentor_id and s.status='active'))));
