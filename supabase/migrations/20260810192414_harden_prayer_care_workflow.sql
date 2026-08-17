-- Finish the care-workflow rollout after the application has stopped writing
-- legacy request statuses. Existing requests are preserved and normalized.
do $migration$
begin
  -- Production has this legacy table, while an isolated repository database
  -- does not. Match the guard used by the preceding normalization migration.
  if to_regclass('public.prayer_requests') is null then
    raise notice 'Skipping prayer-care hardening: legacy prayer tables are not present.';
    return;
  end if;

  update public.prayer_requests
  set status = case status
    when 'New' then 'Submitted'
    when 'Being Prayed For' then 'Active Care'
    when 'Contacted' then 'Follow-Up'
    when 'Ongoing' then 'Active Care'
    when 'Follow-Up Needed' then 'Follow-Up'
    when 'Answered' then 'Resolved'
    else status
  end
  where status in (
    'New', 'Being Prayed For', 'Contacted', 'Ongoing',
    'Follow-Up Needed', 'Answered'
  );

  alter table public.prayer_requests
    alter column status set default 'Submitted',
    drop constraint if exists prayer_requests_status_check;

  alter table public.prayer_requests
    add constraint prayer_requests_status_check
    check (status in (
      'Submitted', 'Reviewed', 'Assigned', 'Active Care', 'Follow-Up',
      'Resolved', 'Closed', 'Needs Reassignment', 'Escalated',
      'Unable to Contact', 'Withdrawn'
    ));
end;
$migration$;

-- Reassignment is a single database operation: select only an account that
-- is both active and available, update the owner, and advance the request to
-- the matching lifecycle state. This prevents a request from retaining an
-- old owner's Active Care state after it has been handed off.
create or replace function public.reassign_prayer_request(
  request_id uuid,
  exclude_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  pool uuid[];
  last_id uuid;
  last_pos integer;
  next_id uuid;
  want_gender text;
  req record;
begin
  select * into req
  from public.prayer_requests
  where id = request_id
  for update;

  if req.id is null then
    return null;
  end if;

  want_gender := null;
  if req.contact_requested is true and req.preferred_care_gender is not null then
    want_gender := req.preferred_care_gender;
  end if;

  if want_gender is not null then
    select array_agg(id order by id)
    into pool
    from public.profiles
    where role in ('admin', 'prayer_team', 'pastor')
      and is_active is true
      and ministry_availability = 'available'
      and id is distinct from req.user_id
      and id is distinct from exclude_user_id
      and gender = want_gender;
  end if;

  if pool is null or array_length(pool, 1) = 0 then
    select array_agg(id order by id)
    into pool
    from public.profiles
    where role in ('admin', 'prayer_team', 'pastor')
      and is_active is true
      and ministry_availability = 'available'
      and id is distinct from req.user_id
      and id is distinct from exclude_user_id;
  end if;

  if pool is null or array_length(pool, 1) = 0 then
    update public.prayer_requests
    set assigned_to = null,
        status = 'Needs Reassignment'
    where id = request_id;
    return null;
  end if;

  select last_assigned_to
  into last_id
  from public.care_team_rotation
  where id = 1
  for update;

  last_pos := null;
  if last_id is not null then
    select ord
    into last_pos
    from unnest(pool) with ordinality as candidate(id, ord)
    where candidate.id = last_id;
  end if;

  if last_pos is null or last_pos >= array_length(pool, 1) then
    next_id := pool[1];
  else
    next_id := pool[last_pos + 1];
  end if;

  update public.prayer_requests
  set assigned_to = next_id,
      status = 'Assigned'
  where id = request_id;

  update public.care_team_rotation
  set last_assigned_to = next_id
  where id = 1;

  return next_id;
end;
$$;

-- This privileged function is server-only. Do not expose it to browser roles.
revoke all on function public.reassign_prayer_request(uuid, uuid) from public;
revoke all on function public.reassign_prayer_request(uuid, uuid) from anon;
revoke all on function public.reassign_prayer_request(uuid, uuid) from authenticated;
grant execute on function public.reassign_prayer_request(uuid, uuid) to service_role;
