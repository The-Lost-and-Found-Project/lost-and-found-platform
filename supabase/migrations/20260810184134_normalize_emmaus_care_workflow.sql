-- Restore the Data API privileges required for authenticated Emmaus progress.
-- RLS remains authoritative and limits every operation to auth.uid().
grant select, insert, update, delete
on table public.emmaus_discovery_progress
to authenticated;

-- Account access (profiles.is_active) is intentionally separate from a
-- volunteer's availability for new ministry assignments. rotation_status is
-- retained as a compatibility field for the existing assignment function.
do $$
begin
  -- The repository's isolated migration suite does not include the legacy
  -- application schema, while deployed environments do. Keep the migration
  -- safe in both contexts.
  if to_regclass('public.profiles') is not null then
    alter table public.profiles
      add column if not exists ministry_availability text not null default 'available',
      add column if not exists missed_assignment_count integer not null default 0,
      add column if not exists availability_review_required boolean not null default false;

    alter table public.profiles
      drop constraint if exists profiles_ministry_availability_check;

    alter table public.profiles
      add constraint profiles_ministry_availability_check
      check (ministry_availability in ('available', 'limited', 'away', 'inactive'));

    update public.profiles
    set ministry_availability = case rotation_status
      when 'active' then 'available'
      when 'paused_neglect' then 'limited'
      when 'paused_sabbatical' then 'away'
      when 'inactive' then 'inactive'
      else 'available'
    end;
  end if;
end;
$$;

create or replace function public.sync_ministry_availability()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT'
     or new.ministry_availability is distinct from old.ministry_availability then
    new.rotation_status := case new.ministry_availability
      when 'available' then 'active'
      when 'limited' then 'paused_neglect'
      when 'away' then 'paused_sabbatical'
      when 'inactive' then 'inactive'
    end;
  elsif new.rotation_status is distinct from old.rotation_status then
    new.ministry_availability := case new.rotation_status
      when 'active' then 'available'
      when 'paused_neglect' then 'limited'
      when 'paused_sabbatical' then 'away'
      when 'inactive' then 'inactive'
      else new.ministry_availability
    end;
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.profiles') is not null then
    drop trigger if exists sync_ministry_availability on public.profiles;
    create trigger sync_ministry_availability
    before insert or update of ministry_availability, rotation_status
    on public.profiles
    for each row execute function public.sync_ministry_availability();
  end if;
end;
$$;

-- Normalize the pastoral care lifecycle without discarding existing requests.
do $$
begin
  if to_regclass('public.prayer_requests') is not null then
    -- Keep the legacy values temporarily valid so the currently deployed app
    -- can continue writing during rollout. Existing rows are normalized below,
    -- while the new app writes only the new lifecycle values.
    alter table public.prayer_requests
      drop constraint if exists prayer_requests_status_check;

    alter table public.prayer_requests
      add constraint prayer_requests_status_check
      check (status in (
        'New', 'Being Prayed For', 'Contacted', 'Ongoing',
        'Follow-Up Needed', 'Answered',
        'Submitted', 'Reviewed', 'Assigned', 'Active Care', 'Follow-Up',
        'Resolved', 'Closed', 'Needs Reassignment', 'Escalated',
        'Unable to Contact', 'Withdrawn'
      ));

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
  end if;
end;
$$;
