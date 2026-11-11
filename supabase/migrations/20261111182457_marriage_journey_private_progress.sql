-- Participant-owned responses; never expose private journals to a mentor by role alone.
create table if not exists public.marriage_journey_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_number integer not null check (session_number between 1 and 21),
  private_reflection text not null default '',
  shared_commitment text not null default '',
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, session_number),
  constraint reflection_limit check (char_length(private_reflection) <= 10000),
  constraint commitment_limit check (char_length(shared_commitment) <= 3000)
);
alter table public.marriage_journey_progress enable row level security;
revoke all on public.marriage_journey_progress from anon;
grant select, insert, update, delete on public.marriage_journey_progress to authenticated;
create policy "Participants read their own marriage progress"
on public.marriage_journey_progress for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Participants create their own marriage progress"
on public.marriage_journey_progress for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Participants update their own marriage progress"
on public.marriage_journey_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Participants delete their own marriage progress"
on public.marriage_journey_progress for delete to authenticated
using ((select auth.uid()) = user_id);
-- Mentor sharing is intentionally not enabled until explicit consent,
-- assignment validation, and access-control tests are implemented.
