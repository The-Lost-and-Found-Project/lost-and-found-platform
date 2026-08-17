-- Phase 2 of the Community App rebuild retires the active Prayer Care
-- assignment system without deleting its history. The archive tables are
-- private to the service role so member clients cannot read legacy ministry
-- data. The original columns and tables remain in place for rollback and
-- future export work.
do $migration$
begin
  if to_regclass('public.prayer_requests') is null
     or to_regclass('public.profiles') is null then
    raise notice 'Skipping Prayer Care retirement: legacy community tables are not present.';
    return;
  end if;

  create table if not exists public.legacy_prayer_care_assignments (
    prayer_request_id uuid primary key,
    assigned_to uuid,
    legacy_status text not null,
    legacy_follow_up_needed boolean,
    legacy_follow_up_date date,
    archived_at timestamptz not null default now(),
    archive_reason text not null default 'community_rebuild_phase_2'
  );

  alter table public.legacy_prayer_care_assignments enable row level security;
  revoke all on table public.legacy_prayer_care_assignments from public, anon, authenticated;
  grant select, insert on table public.legacy_prayer_care_assignments to service_role;

  insert into public.legacy_prayer_care_assignments (
    prayer_request_id,
    assigned_to,
    legacy_status,
    legacy_follow_up_needed,
    legacy_follow_up_date
  )
  select id, assigned_to, status, follow_up_needed, follow_up_date
  from public.prayer_requests
  where assigned_to is not null
  on conflict (prayer_request_id) do nothing;

  create table if not exists public.legacy_prayer_care_members (
    profile_id uuid primary key,
    legacy_role text not null,
    legacy_rotation_status text,
    legacy_ministry_availability text,
    legacy_missed_assignment_count integer,
    legacy_availability_review_required boolean,
    legacy_reinstatement_requested_at timestamptz,
    archived_at timestamptz not null default now(),
    archive_reason text not null default 'community_rebuild_phase_2'
  );

  alter table public.legacy_prayer_care_members enable row level security;
  revoke all on table public.legacy_prayer_care_members from public, anon, authenticated;
  grant select, insert on table public.legacy_prayer_care_members to service_role;

  insert into public.legacy_prayer_care_members (
    profile_id,
    legacy_role,
    legacy_rotation_status,
    legacy_ministry_availability,
    legacy_missed_assignment_count,
    legacy_availability_review_required,
    legacy_reinstatement_requested_at
  )
  select
    id,
    role,
    rotation_status,
    ministry_availability,
    missed_assignment_count,
    availability_review_required,
    reinstatement_requested_at
  from public.profiles
  where role = 'prayer_team'
  on conflict (profile_id) do nothing;

  -- Stop all new automatic ownership and assignment notifications before
  -- normalizing the live rows. Moderation and prayer-count triggers remain.
  drop trigger if exists assign_next_care_team_member_trigger on public.prayer_requests;
  drop trigger if exists notify_auto_assigned_care_team_member_trigger on public.prayer_requests;
  drop trigger if exists on_prayer_request_assigned_notify on public.prayer_requests;
  drop trigger if exists on_prayer_request_updated_notify on public.prayer_requests;

  update public.prayer_requests
  set assigned_to = null,
      status = case
        when status in ('Assigned', 'Active Care', 'Follow-Up', 'Needs Reassignment')
          then case when moderation_status = 'approved' then 'Reviewed' else 'Submitted' end
        else status
      end,
      follow_up_needed = false,
      follow_up_date = null
  where assigned_to is not null
     or status in ('Assigned', 'Active Care', 'Follow-Up', 'Needs Reassignment')
     or follow_up_needed is true
     or follow_up_date is not null;

  update public.profiles
  set role = 'member',
      preview_role = null,
      ministry_availability = 'inactive',
      availability_review_required = false,
      reinstatement_requested_at = null
  where role = 'prayer_team';

  update public.profiles
  set preview_role = null
  where preview_role = 'prayer_team';

  update public.notifications
  set link = case
      when type in ('prayed_for', 'status_change', 'check_in_needed')
        then '/prayer/my-requests'
      else '/prayer'
    end,
    body = case
      when type = 'prayed_for' then 'Someone in the community prayed with you. Open My Prayer Requests to see the update.'
      when type = 'status_change' then 'Open My Prayer Requests to review the update.'
      when type = 'check_in_needed' then 'Open My Prayer Requests to review or update your request.'
      when type in ('assigned', 'idle_assignment', 'prayer_reassigned') then 'This legacy Prayer Care notification is retained for your history. Open Prayer to pray with the community.'
      else body
    end
  where type in (
    'assigned', 'prayed_for', 'status_change', 'check_in_needed',
    'idle_assignment', 'prayer_reassigned'
  );

  execute $function$
  create or replace function public.notify_prayer_reaction()
  returns trigger
  language plpgsql
  security definer
  set search_path = 'public'
  as $body$
  declare
    requester_id uuid;
    notify_enabled boolean;
  begin
    select user_id into requester_id
    from public.prayer_requests
    where id = new.prayer_request_id;

    if requester_id is not null and requester_id is distinct from new.user_id then
      select prayer_reaction_notifications into notify_enabled
      from public.user_settings
      where user_id = requester_id;

      if coalesce(notify_enabled, true) then
        insert into public.notifications (
          user_id, type, title, body, link, prayer_request_id
        ) values (
          requester_id,
          'prayed_for',
          'Someone prayed for your request',
          'Someone in the community prayed with you. Open My Prayer Requests to see the update.',
          '/prayer/my-requests',
          new.prayer_request_id
        );
      end if;
    end if;
    return new;
  end;
  $body$;
  $function$;

  execute $function$
  create or replace function public.notify_prayer_request_updates()
  returns trigger
  language plpgsql
  security definer
  set search_path = 'public'
  as $body$
  begin
    if new.user_id is not null and old.status is distinct from new.status then
      insert into public.notifications (
        user_id, type, title, body, link, prayer_request_id
      ) values (
        new.user_id,
        'status_change',
        'Your prayer request was updated',
        'Open My Prayer Requests to review the update.',
        '/prayer/my-requests',
        new.id
      );
    end if;
    return new;
  end;
  $body$;
  $function$;

  create trigger on_prayer_request_updated_notify
  after update of status on public.prayer_requests
  for each row execute function public.notify_prayer_request_updates();

  revoke all on function public.assign_next_care_team_member() from public, anon, authenticated, service_role;
  revoke all on function public.get_prayer_request_assignment(uuid) from public, anon, authenticated, service_role;
  revoke all on function public.reassign_prayer_request(uuid, uuid) from public, anon, authenticated, service_role;

  comment on table public.legacy_prayer_care_assignments is
    'Private Phase 2 archive of Prayer Care ownership removed from live prayer requests.';
  comment on table public.legacy_prayer_care_members is
    'Private Phase 2 archive of former Prayer Care roles and rotation state.';
  comment on column public.prayer_requests.assigned_to is
    'Legacy Prayer Care field retained for rollback/export. New requests are never assigned.';
end;
$migration$;
