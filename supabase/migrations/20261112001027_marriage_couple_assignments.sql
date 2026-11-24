-- Marriage Journey access is always a specifically assigned pair of accounts.
create table public.marriage_couples (
 id uuid primary key default gen_random_uuid(),
 spouse_one uuid not null references auth.users(id),
 spouse_two uuid not null references auth.users(id),
 assigned_by uuid not null references auth.users(id),
 assigned_at timestamptz not null default now(),
 revoked_at timestamptz,
 constraint marriage_couples_distinct check(spouse_one <> spouse_two)
);
create unique index marriage_couples_active_one on public.marriage_couples(spouse_one) where revoked_at is null;
create unique index marriage_couples_active_two on public.marriage_couples(spouse_two) where revoked_at is null;
create index marriage_couples_other_one on public.marriage_couples(spouse_two) where revoked_at is null;
-- A user cannot occupy either position in two active couples.
create or replace function public.prevent_overlapping_marriage_couples() returns trigger language plpgsql set search_path='' as $$
begin
 if new.revoked_at is null and exists (
 select 1 from public.marriage_couples c where c.id<>new.id and c.revoked_at is null
 and (c.spouse_one in (new.spouse_one,new.spouse_two) or c.spouse_two in (new.spouse_one,new.spouse_two))
 ) then raise exception 'A participant is already assigned to an active marriage couple'; end if;
 return new;
end $$;
create trigger prevent_overlapping_marriage_couples before insert or update on public.marriage_couples for each row execute function public.prevent_overlapping_marriage_couples();
alter table public.marriage_couples enable row level security;
revoke all on public.marriage_couples from anon;
grant select on public.marriage_couples to authenticated;
create policy "Spouses read own active couple" on public.marriage_couples for select to authenticated
 using (revoked_at is null and ((select auth.uid())=spouse_one or (select auth.uid())=spouse_two));
-- Old individual assignments remain in storage but do not confer access without a couple.
create or replace function public.has_active_marriage_couple(uid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select uid=(select auth.uid()) and exists (
 select 1 from public.marriage_couples c where c.revoked_at is null and (c.spouse_one=uid or c.spouse_two=uid)
 and exists(select 1 from public.marriage_journey_assignments a where a.user_id=c.spouse_one and a.revoked_at is null)
 and exists(select 1 from public.marriage_journey_assignments a where a.user_id=c.spouse_two and a.revoked_at is null));
$$;
revoke all on function public.has_active_marriage_couple(uuid) from public,anon;
grant execute on function public.has_active_marriage_couple(uuid) to authenticated;
-- Separate discussion answers: never derived from private reflections or mentor commitments.
create table public.marriage_couple_answers (
 couple_id uuid not null references public.marriage_couples(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 session_number integer not null check(session_number between 1 and 21),
 answer_text text not null check(char_length(btrim(answer_text)) between 1 and 3000),
 submitted_at timestamptz not null default now(),
 primary key(couple_id,user_id,session_number)
);
alter table public.marriage_couple_answers enable row level security;
revoke all on public.marriage_couple_answers from anon;
grant select,insert on public.marriage_couple_answers to authenticated;
create policy "Spouse submits own answer to assigned couple" on public.marriage_couple_answers for insert to authenticated
 with check (user_id=(select auth.uid()) and public.has_active_marriage_couple((select auth.uid()))
 and exists(select 1 from public.marriage_couples c where c.id=couple_id and c.revoked_at is null and (c.spouse_one=user_id or c.spouse_two=user_id)));
create or replace function public.has_submitted_marriage_couple_answer(cid uuid, session_num integer) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.marriage_couple_answers a where a.couple_id=cid and a.session_number=session_num and a.user_id=(select auth.uid()));
$$;
revoke all on function public.has_submitted_marriage_couple_answer(uuid,integer) from public,anon;
grant execute on function public.has_submitted_marriage_couple_answer(uuid,integer) to authenticated;
create policy "Spouses see answers after own submission" on public.marriage_couple_answers for select to authenticated
 using (public.has_active_marriage_couple((select auth.uid()))
 and exists(select 1 from public.marriage_couples c where c.id=couple_id and c.revoked_at is null
 and ((c.spouse_one=(select auth.uid()) and (user_id=c.spouse_one or user_id=c.spouse_two))
 or (c.spouse_two=(select auth.uid()) and (user_id=c.spouse_one or user_id=c.spouse_two))))
 and (user_id=(select auth.uid()) or public.has_submitted_marriage_couple_answer(couple_id,session_number)));
-- Revoke the two underlying assignments when a couple is revoked; private workbooks remain private.
create or replace function public.revoke_marriage_couple_assignments() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.revoked_at is not null and old.revoked_at is null then
 update public.marriage_journey_assignments set revoked_at=new.revoked_at where user_id in (new.spouse_one,new.spouse_two) and revoked_at is null;
 end if;
 return new;
end $$;
create trigger revoke_marriage_couple_assignments after update on public.marriage_couples for each row execute function public.revoke_marriage_couple_assignments();
-- Restrict existing personal progress policies to valid paired assignments.
drop policy if exists "Assigned participants read own progress" on public.marriage_journey_progress;
create policy "Assigned participants read own progress" on public.marriage_journey_progress for select to authenticated using (user_id=(select auth.uid()) and public.has_active_marriage_couple((select auth.uid())));
drop policy if exists "Assigned participants create own progress" on public.marriage_journey_progress;
create policy "Assigned participants create own progress" on public.marriage_journey_progress for insert to authenticated with check (user_id=(select auth.uid()) and public.has_active_marriage_couple((select auth.uid())));
drop policy if exists "Assigned participants update own progress" on public.marriage_journey_progress;
create policy "Assigned participants update own progress" on public.marriage_journey_progress for update to authenticated using (user_id=(select auth.uid()) and public.has_active_marriage_couple((select auth.uid()))) with check (user_id=(select auth.uid()) and public.has_active_marriage_couple((select auth.uid())));
-- Shared milestone status without exposing either spouse's private workbook.
create or replace function public.marriage_couple_completed_sessions() returns table(session_number integer, spouse_one_done boolean, spouse_two_done boolean)
language sql stable security definer set search_path='' as $$
 select s.n, exists(select 1 from public.marriage_journey_progress p where p.user_id=c.spouse_one and p.session_number=s.n and p.completed_at is not null),
 exists(select 1 from public.marriage_journey_progress p where p.user_id=c.spouse_two and p.session_number=s.n and p.completed_at is not null)
 from public.marriage_couples c cross join generate_series(1,21) as s(n)
 where c.revoked_at is null and (c.spouse_one=(select auth.uid()) or c.spouse_two=(select auth.uid()))
 and public.has_active_marriage_couple((select auth.uid()));
$$;
revoke all on function public.marriage_couple_completed_sessions() from public,anon;
grant execute on function public.marriage_couple_completed_sessions() to authenticated;
