-- Track push delivery without exposing subscription details to clients.
-- Existing notification history predates delivery tracking, so it is marked
-- not_applicable instead of appearing as overdue.
alter table public.notifications
  add column if not exists push_status text,
  add column if not exists push_attempted_at timestamptz,
  add column if not exists push_delivered_at timestamptz,
  add column if not exists push_error text;

update public.notifications
set push_status = 'not_applicable'
where push_status is null;

alter table public.notifications
  alter column push_status set default 'pending',
  alter column push_status set not null;

alter table public.notifications
  drop constraint if exists notifications_push_status_check,
  add constraint notifications_push_status_check
  check (push_status in ('pending', 'sent', 'skipped', 'failed', 'not_applicable'));

create index if not exists notifications_push_attention_idx
  on public.notifications (push_status, created_at desc)
  where push_status in ('pending', 'failed');

create or replace function public.get_notification_delivery_health()
returns table (failed_count bigint, pending_overdue_count bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Admins only';
  end if;

  return query
  select
    count(*) filter (
      where n.push_status = 'failed'
        and n.created_at >= now() - interval '7 days'
    ),
    count(*) filter (
      where n.push_status = 'pending'
        and n.created_at <= now() - interval '5 minutes'
    )
  from public.notifications n;
end;
$$;

revoke all on function public.get_notification_delivery_health() from public;
revoke all on function public.get_notification_delivery_health() from anon;
grant execute on function public.get_notification_delivery_health() to authenticated;

-- Preserve notification history while removing private prayer and identity
-- excerpts from existing in-app rows.
update public.notifications
set body = case type
  when 'assigned' then 'A prayer request is ready for your care. Open your assignments to review the private details.'
  when 'prayed_for' then 'Someone in the community prayed with you. Open My Journey to see the update.'
  when 'status_change' then 'Open My Journey to review the update and choose any next step.'
  when 'check_in_needed' then 'It has been about a week since there was an update. Let us know if you still need prayer, it has been answered, or you would like to update or remove it.'
  when 'idle_assignment' then 'Open Prayer Operations to review overdue care, current ownership, and reassignment options.'
  when 'prayer_reassigned' then 'A prayer request was returned to the team for timely care. Open your assignments to review the private details and next steps.'
  when 'new_member' then 'A new member joined the community. Open People & Roles to review their account.'
  else body
end
where type in (
  'assigned', 'prayed_for', 'status_change', 'check_in_needed',
  'idle_assignment', 'prayer_reassigned', 'new_member'
);

-- Prayer details belong behind authenticated screens, not in lock-screen
-- previews. These functions retain the same recipients and destinations.
create or replace function public.notify_auto_assigned_care_team_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assigned_to is not null then
    insert into public.notifications (
      user_id, type, title, body, link, prayer_request_id
    ) values (
      new.assigned_to,
      'assigned',
      'You have been matched with a prayer request',
      'A prayer request is ready for your care. Open your assignments to review the private details.',
      '/prayer-assignments',
      new.id
    );
  end if;
  return new;
end;
$$;

create or replace function public.notify_prayer_request_assigned()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assigned_to is not null
     and new.assigned_to is distinct from old.assigned_to then
    insert into public.notifications (
      user_id, type, title, body, link, prayer_request_id
    ) values (
      new.assigned_to,
      'assigned',
      'You have been matched with a prayer request',
      'A prayer request is ready for your care. Open your assignments to review the private details.',
      '/prayer-assignments',
      new.id
    );
  end if;
  return new;
end;
$$;

create or replace function public.notify_prayer_reaction()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
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
        'Someone in the community prayed with you. Open My Journey to see the update.',
        '/my-journey',
        new.prayer_request_id
      );
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.notify_prayer_request_updates()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if new.user_id is not null and old.status is distinct from new.status then
    insert into public.notifications (
      user_id, type, title, body, link, prayer_request_id
    ) values (
      new.user_id,
      'status_change',
      case
        when new.status in ('Resolved', 'Closed') then 'Your prayer request received a care update'
        else 'Your prayer request moved to ' || new.status
      end,
      'Open My Journey to review the update and choose any next step.',
      '/my-journey',
      new.id
    );
  end if;
  return new;
end;
$$;

create or replace function public.notify_new_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  select
    prof.id,
    'new_member',
    'A new member joined',
    'A new member joined the community. Open People & Roles to review their account.',
    '/admin/users'
  from public.profiles prof
  where prof.role = 'admin'
    and prof.id is distinct from new.id;
  return new;
end;
$$;
