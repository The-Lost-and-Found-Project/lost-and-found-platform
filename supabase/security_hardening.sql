-- Reviewed security hardening for the existing production schema.
-- Apply through the Supabase migration workflow after testing in a preview
-- environment. This file intentionally does not activate any Coming Soon app.

begin;

-- Public views must use the caller's RLS policies instead of the view owner's
-- privileges. The view predicates continue to expose only approved content.
alter view public.prayer_wall_public set (security_invoker = true);
alter view public.praise_wall_public set (security_invoker = true);

drop policy if exists praise_select_public_approved on public.praise_reports;
create policy praise_select_public_approved
on public.praise_reports
for select
to anon, authenticated
using (moderation_status = 'approved');

-- Testimonies currently join profiles to show a member's name. Keep this view
-- unchanged until a dedicated public-display-name projection is introduced;
-- granting public profile access would expose substantially more information.

-- Trigger helpers and server-only RPCs should not be public REST endpoints.
-- The two functions below are intentionally retained for current public flows.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_care_team() to anon, authenticated;
grant execute on function public.get_prayer_request_assignment(uuid) to anon, authenticated;
grant execute on function public.get_quiz_questions(text, integer) to authenticated;

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

-- Public buckets already serve object URLs without a broad SELECT policy.
drop policy if exists avatars_public_read on storage.objects;
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

commit;
