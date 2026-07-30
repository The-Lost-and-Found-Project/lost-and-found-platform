-- Prayer Team members should receive assignment notices, but those notices
-- must open their assignments-only workspace rather than the admin dashboard.
create or replace function public.notify_auto_assigned_care_team_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assigned_to is not null then
    insert into public.notifications (
      user_id,
      type,
      title,
      body,
      link,
      prayer_request_id
    )
    values (
      new.assigned_to,
      'assigned',
      'You have been matched with a prayer request',
      left(new.request_text, 140),
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
      user_id,
      type,
      title,
      body,
      link,
      prayer_request_id
    )
    values (
      new.assigned_to,
      'assigned',
      'You have been matched with a prayer request',
      left(new.request_text, 140),
      '/prayer-assignments',
      new.id
    );
  end if;

  return new;
end;
$$;

create or replace function public.notify_prayer_care_application_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'approved' then
      insert into public.notifications (
        user_id,
        type,
        title,
        body,
        link,
        application_id
      )
      values (
        new.user_id,
        'prayer_care_application_approved',
        'You''re on the Prayer Care Team!',
        'Your application to join the Prayer Care Team was approved. Welcome to the team!',
        '/prayer-assignments',
        new.id
      );
    elsif new.status = 'denied' then
      insert into public.notifications (
        user_id,
        type,
        title,
        body,
        link,
        application_id
      )
      values (
        new.user_id,
        'prayer_care_application_denied',
        'About your Prayer Care Team application',
        coalesce(
          new.review_note,
          'Thank you for applying. We are not able to bring you onto the team at this time.'
        ),
        '/prayer-care-application',
        new.id
      );
    end if;
  end if;

  return new;
end;
$$;

update public.notifications n
set link = '/prayer-assignments'
from public.profiles recipient
where n.user_id = recipient.id
  and recipient.role <> 'admin'
  and n.link = '/admin'
  and n.type in ('assigned', 'prayer_care_application_approved');

-- This obsolete care-team broadcast exposed an admin-only destination and
-- has been superseded by direct assignment notifications.
delete from public.notifications n
using public.profiles recipient
where n.user_id = recipient.id
  and recipient.role <> 'admin'
  and n.link = '/admin'
  and n.type = 'new_request'
  and n.title = 'New prayer request submitted';
