-- Queue follower notifications atomically with the content publication.
-- A failed insert rolls back the publication instead of silently losing delivery.
-- The existing push-delivery cron processes pending notification rows.
create schema if not exists ministry_internal;
revoke all on schema ministry_internal from public, anon, authenticated;

create or replace function ministry_internal.queue_publication_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare ministry_name text;
begin
  if new.is_published is not true then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.is_published is true then
    return new;
  end if;

  ministry_name := case new.ministry_slug
    when 'hearth' then 'The Hearth'
    when 'foundry' then 'The Foundry'
    when 'mens-study' then 'Men''s Study'
    else 'Ministry'
  end;

  insert into public.notifications(user_id, type, title, body, link, push_status)
  select distinct mm.user_id,
    'ministry_update',
    'New ' || new.content_type || ' in ' || ministry_name,
    new.title,
    '/ministries/' || new.ministry_slug,
    'pending'
  from public.ministry_memberships mm
  where mm.ministry_slug = new.ministry_slug;

  return new;
end;
$function$;

revoke all on function ministry_internal.queue_publication_notifications()
  from public, anon, authenticated;

drop trigger if exists ministry_publication_notifications on public.ministry_content;
create trigger ministry_publication_notifications
after insert or update of is_published on public.ministry_content
for each row
execute function ministry_internal.queue_publication_notifications();
