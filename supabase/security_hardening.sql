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

-- RLS controls which profile row a member may update, but table-level UPDATE
-- grants would otherwise let them change privileged columns on that row
-- (including role and rotation status) through the Data API. Keep ordinary
-- profile editing available while reserving authorization and rotation state
-- for trusted server routes that use the service role.
revoke update on table public.profiles from public, anon, authenticated;
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

commit;
