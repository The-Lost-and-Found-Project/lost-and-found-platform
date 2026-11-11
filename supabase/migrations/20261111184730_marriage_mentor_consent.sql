-- Explicit participant-controlled mentor sharing. Private journal table remains inaccessible.
create table public.marriage_mentor_shares (
 participant_id uuid not null references auth.users(id) on delete cascade,
 mentor_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'active' check (status in ('active','revoked')),
 share_progress boolean not null default true,
 share_commitments boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key (participant_id,mentor_id),
 check (participant_id <> mentor_id)
);
alter table public.marriage_mentor_shares enable row level security;
revoke all on public.marriage_mentor_shares from anon;
grant select,insert,update,delete on public.marriage_mentor_shares to authenticated;
create policy "Participant or mentor sees grant" on public.marriage_mentor_shares for select to authenticated
using ((select auth.uid()) = participant_id or (select auth.uid()) = mentor_id);
create policy "Participant grants access" on public.marriage_mentor_shares for insert to authenticated
with check ((select auth.uid()) = participant_id);
create policy "Participant changes grant" on public.marriage_mentor_shares for update to authenticated
using ((select auth.uid()) = participant_id) with check ((select auth.uid()) = participant_id);
create policy "Participant removes grant" on public.marriage_mentor_shares for delete to authenticated
using ((select auth.uid()) = participant_id);

-- Explicitly copied, minimal mentor-facing updates; no private reflections.
create table public.marriage_mentor_updates (
 participant_id uuid not null references auth.users(id) on delete cascade,
 mentor_id uuid not null references auth.users(id) on delete cascade,
 session_number integer not null check (session_number between 1 and 21),
 completed boolean not null default false,
 commitment text not null default '' check (char_length(commitment) <= 3000),
 shared_at timestamptz not null default now(),
 primary key (participant_id,mentor_id,session_number),
 foreign key (participant_id,mentor_id) references public.marriage_mentor_shares(participant_id,mentor_id) on delete cascade
);
alter table public.marriage_mentor_updates enable row level security;
revoke all on public.marriage_mentor_updates from anon;
grant select,insert,update,delete on public.marriage_mentor_updates to authenticated;
create policy "Participant or active mentor reads shared updates" on public.marriage_mentor_updates for select to authenticated
using ((select auth.uid()) = participant_id or ((select auth.uid()) = mentor_id and exists (
 select 1 from public.marriage_mentor_shares s where s.participant_id = marriage_mentor_updates.participant_id
 and s.mentor_id = marriage_mentor_updates.mentor_id and s.status = 'active'
)));
create policy "Participant creates shared update" on public.marriage_mentor_updates for insert to authenticated
with check ((select auth.uid()) = participant_id and exists (
 select 1 from public.marriage_mentor_shares s where s.participant_id = marriage_mentor_updates.participant_id
 and s.mentor_id = marriage_mentor_updates.mentor_id and s.status = 'active'
 and (s.share_commitments or commitment = '') and (s.share_progress or completed = false)
));
create policy "Participant changes shared update" on public.marriage_mentor_updates for update to authenticated
using ((select auth.uid()) = participant_id)
with check ((select auth.uid()) = participant_id and exists (
 select 1 from public.marriage_mentor_shares s where s.participant_id = marriage_mentor_updates.participant_id
 and s.mentor_id = marriage_mentor_updates.mentor_id and s.status = 'active'
 and (s.share_commitments or commitment = '') and (s.share_progress or completed = false)
));
create policy "Participant deletes shared update" on public.marriage_mentor_updates for delete to authenticated
using ((select auth.uid()) = participant_id);
-- No policies ever grant mentors access to marriage_journey_progress.

-- Permission reductions must remove old snapshots at the database layer, not only hide UI fields.
create function public.clear_marriage_updates_on_permission_change()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.share_progress is distinct from new.share_progress
    or old.share_commitments is distinct from new.share_commitments
    or old.status is distinct from new.status then
    delete from public.marriage_mentor_updates
    where participant_id = new.participant_id and mentor_id = new.mentor_id;
  end if;
  return new;
end;
$$;
revoke all on function public.clear_marriage_updates_on_permission_change() from public, anon, authenticated;
create trigger clear_marriage_updates_on_permission_change
before update on public.marriage_mentor_shares
for each row execute function public.clear_marriage_updates_on_permission_change();
