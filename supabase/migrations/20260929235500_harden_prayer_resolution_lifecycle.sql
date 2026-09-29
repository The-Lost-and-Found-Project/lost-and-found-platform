-- Keep the Prayer Wall focused on active needs while preserving resolved history.
do $migration$
begin
  if to_regclass('public.prayer_requests') is null then
    raise notice 'Skipping prayer resolution lifecycle hardening: legacy prayer_requests is not present.';
    return;
  end if;

  -- Normalize existing resolved rows so previously answered requests no longer
  -- remain in the active public Prayer Wall.
  update public.prayer_requests
  set is_public=false
  where answered is true
    and is_public is true;

  -- Defense in depth: even if a future client forgets to clear is_public,
  -- the public projection never publishes answered/resolved/withdrawn/closed rows.
  if to_regclass('community_feed_private.prayer_wall_data') is not null then
    create or replace view community_feed_private.prayer_wall_data
    with (security_barrier = true)
    as
    select
      id,
      created_at,
      category_id,
      request_text,
      prayer_count,
      status,
      case when is_anonymous then null::text else name end as display_name,
      coalesce(user_id = (select auth.uid()), false) as is_own
    from public.prayer_requests
    where is_public is true
      and moderation_status = 'approved'
      and coalesce(archived, false) is false
      and coalesce(answered, false) is false
      and status not in ('Resolved','Closed','Withdrawn');
  end if;
end
$migration$;
