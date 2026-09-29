alter table public.study_session_participants
  add column if not exists rsvp_status text not null default 'invited',
  add column if not exists responded_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'study_session_participants_rsvp_status_check'
      and conrelid = 'public.study_session_participants'::regclass
  ) then
    alter table public.study_session_participants
      add constraint study_session_participants_rsvp_status_check
      check (rsvp_status in ('invited','going','maybe','declined'));
  end if;
end $$;

create or replace function public.respond_to_study_session(p_session_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_status not in ('going','maybe','declined') then
    raise exception 'Invalid RSVP status';
  end if;
  update public.study_session_participants
  set rsvp_status = p_status,
      responded_at = now()
  where study_session_id = p_session_id
    and user_id = auth.uid();
  if not found then
    raise exception 'Study session invitation not found';
  end if;
end;
$$;

revoke all on function public.respond_to_study_session(uuid,text) from public, anon;
grant execute on function public.respond_to_study_session(uuid,text) to authenticated;
