-- Keep the intentionally public Prayer, Praise, and Testimony projections
-- available without leaving SECURITY DEFINER views in the exposed public
-- schema. The privileged filtering layer lives in an unexposed schema; the
-- public wrappers are SECURITY INVOKER and expose only the approved columns.

create schema if not exists community_feed_private;

revoke all on schema community_feed_private from public;
grant usage on schema community_feed_private to anon, authenticated, service_role;

-- Older production environments already have this lifecycle flag, while a
-- database rebuilt solely from tracked migrations may not. Add it only when
-- missing so the secured public projection behaves consistently everywhere.
alter table public.prayer_requests
  add column if not exists archived boolean not null default false;

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
  case when is_anonymous then null::text else name end as display_name
from public.prayer_requests
where is_public is true
  and moderation_status = 'approved'
  and coalesce(archived, false) is false;

create or replace view community_feed_private.praise_wall_data
with (security_barrier = true)
as
select id, content_text, created_at, love_count
from public.praise_reports
where moderation_status = 'approved';

create or replace view community_feed_private.testimonies_data
with (security_barrier = true)
as
select
  t.id,
  t.content_text as faith_story,
  t.updated_at,
  t.user_id,
  case when t.is_anonymous then null::text else p.full_name end as display_name
from public.testimonies t
left join public.profiles p on p.id = t.user_id
where t.moderation_status = 'approved';

revoke all on table
  community_feed_private.prayer_wall_data,
  community_feed_private.praise_wall_data,
  community_feed_private.testimonies_data
from public, anon, authenticated, service_role;

grant select on table
  community_feed_private.prayer_wall_data,
  community_feed_private.praise_wall_data,
  community_feed_private.testimonies_data
to anon, authenticated, service_role;

create or replace view public.prayer_wall_public
with (security_invoker = true, security_barrier = true)
as
select id, created_at, category_id, request_text, prayer_count, status, display_name
from community_feed_private.prayer_wall_data;

create or replace view public.praise_wall_public
with (security_invoker = true, security_barrier = true)
as
select id, content_text, created_at, love_count
from community_feed_private.praise_wall_data;

create or replace view public.testimonies_public
with (security_invoker = true, security_barrier = true)
as
select id, faith_story, updated_at, user_id, display_name
from community_feed_private.testimonies_data;

revoke all on table
  public.prayer_wall_public,
  public.praise_wall_public,
  public.testimonies_public
from public, anon, authenticated, service_role;

grant select on table
  public.prayer_wall_public,
  public.praise_wall_public,
  public.testimonies_public
to anon, authenticated, service_role;
