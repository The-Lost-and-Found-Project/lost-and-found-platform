-- Reviewed security hardening for the existing production schema.
-- Apply through the Supabase migration workflow after testing in a preview
-- environment. This file intentionally does not activate any Coming Soon app.

begin;

-- These narrow public projections intentionally remain security-definer views:
-- the underlying tables contain owner, contact, and moderation fields that
-- must not become directly readable just to satisfy a view. A security barrier
-- prevents caller-supplied predicates from being evaluated ahead of the
-- approved/public filters. Remove the accidental base-table public policy so
-- prayer contact information is available only to its owner and care team.
alter view public.prayer_wall_public set (security_barrier = true);
alter view public.praise_wall_public set (security_barrier = true);
alter view public.testimonies_public set (security_barrier = true);
drop policy if exists requests_select_public on public.prayer_requests;

-- Trigger helpers and server-only RPCs should not be public REST endpoints.
-- Remove PostgreSQL's default PUBLIC execute privilege for both existing and
-- future app functions. Service-role grants remain intact for trusted routes.
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- These are the only functions called by browser roles. is_care_team() is
-- also used by RLS policies; quiz questions are available to signed-in users.
grant execute on function public.is_care_team() to anon, authenticated;
grant execute on function public.get_quiz_questions(text, integer) to authenticated;

-- Fix the mutable search-path warning without changing function behavior.
-- Every referenced app object is schema-qualified; built-ins resolve through
-- pg_catalog even with an empty search path.
alter function public.is_care_team() set search_path = '';
alter function public.get_quiz_questions(text, integer) set search_path = '';
alter function public.set_updated_at() set search_path = '';

-- An authenticated reaction must belong to the caller. Anonymous reactions
-- must carry an anonymous-browser key and no user id.
drop policy if exists reactions_insert_anyone on public.prayer_reactions;
create policy reactions_insert_valid_identity
on public.prayer_reactions
for insert
to anon, authenticated
with check (
  (auth.uid() is not null and user_id = auth.uid() and anon_key is null)
  or
  (auth.uid() is null and user_id is null and nullif(btrim(anon_key), '') is not null)
);

alter table public.prayer_reactions
  drop constraint if exists prayer_reactions_identity;
alter table public.prayer_reactions
  add constraint prayer_reactions_identity check (
    (user_id is not null and anon_key is null)
    or
    (user_id is null and nullif(btrim(anon_key), '') is not null)
  );

-- Public buckets already serve object URLs without a broad SELECT policy.
-- Keep owner SELECT access because Storage upserts require SELECT + UPDATE.
drop policy if exists avatars_public_read on storage.objects;
drop policy if exists avatars_select_own on storage.objects;
create policy avatars_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

-- Supabase's historical default grants gave every Data API role every table
-- privilege, including TRUNCATE, TRIGGER, and REFERENCES. Make browser access
-- opt-in and match it to the operations the app actually performs. RLS remains
-- the second layer that restricts which rows each caller may reach.
revoke all privileges on all tables in schema public
  from public, anon, authenticated;
revoke truncate, references, trigger on all tables in schema public
  from service_role;

-- Anonymous visitors can read only public projections/reference data and can
-- submit a prayer request or reaction. They never receive base-table reads for
-- prayer, praise, testimony, profile, or internal operations.
grant select on table
  public.devotion_weeks,
  public.prayer_categories,
  public.prayer_reactions,
  public.prayer_wall_public,
  public.praise_wall_public,
  public.testimonies_public
to anon;
grant insert on table public.prayer_requests, public.prayer_reactions to anon;

-- Signed-in application workflows. These grants permit an operation class;
-- table RLS and column grants still determine the allowed rows and fields.
grant select on table
  public.devotion_weeks,
  public.feedback_messages,
  public.journey_entries,
  public.notifications,
  public.praise_reports,
  public.prayer_care_applications,
  public.prayer_categories,
  public.prayer_reactions,
  public.prayer_requests,
  public.profiles,
  public.push_subscriptions,
  public.quiz_attempts,
  public.testimonies,
  public.trivia_categories,
  public.trivia_questions,
  public.user_settings,
  public.prayer_wall_public,
  public.praise_wall_public,
  public.testimonies_public
to authenticated;

grant insert on table
  public.feedback_messages,
  public.journey_entries,
  public.prayer_care_applications,
  public.prayer_reactions,
  public.prayer_requests,
  public.push_subscriptions,
  public.quiz_attempts,
  public.testimonies,
  public.user_settings
to authenticated;

grant update on table
  public.feedback_messages,
  public.journey_entries,
  public.notifications,
  public.praise_reports,
  public.prayer_requests,
  public.push_subscriptions,
  public.testimonies,
  public.user_settings
to authenticated;

grant delete on table
  public.journey_entries,
  public.notifications,
  public.push_subscriptions
to authenticated;

-- RLS controls which profile row a member may update, while column grants
-- reserve authorization and rotation state for trusted service-role routes.
grant update (
  full_name,
  faith_story,
  favorite_scripture,
  avatar_url,
  date_of_salvation,
  date_of_baptism,
  preview_role,
  gender,
  phone
) on table public.profiles to authenticated;

-- Trusted server routes need ordinary CRUD, not database-definition powers.
grant select, insert, update, delete on all tables in schema public
  to service_role;

-- Future public-schema objects start private for browser roles. Trusted server
-- routes retain CRUD and sequence access; new browser workflows must opt in.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all privileges on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to service_role;

revoke all privileges on all sequences in schema public
  from public, anon, authenticated;
grant usage, select on all sequences in schema public
  to service_role;

commit;
