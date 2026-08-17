-- The Prayer Care retirement revoked is_care_team(), but several RLS
-- policies still called it. PostgreSQL evaluates those policy expressions
-- even when the member is reading their own row, so profile and prayer reads
-- failed with permission denied instead of returning preserved data.
--
-- Replace only those stale policy dependencies. Community Members retain
-- access to their own records; Community Admins retain the same moderation
-- access; former Prayer Care roles gain no access.

create or replace function public.is_community_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_community_admin()
from public, anon, authenticated, service_role;

grant execute on function public.is_community_admin()
to authenticated, service_role;

drop policy if exists profiles_select_own_or_care_team on public.profiles;
create policy profiles_select_own_or_community_admin
on public.profiles
for select
to authenticated
using (auth.uid() = id or (select public.is_community_admin()));

drop policy if exists prayer_activities_select_own_or_care_team on public.prayer_reactions;
create policy prayer_activities_select_own_or_community_admin
on public.prayer_reactions
for select
to authenticated
using (user_id = (select auth.uid()) or (select public.is_community_admin()));

drop policy if exists requests_select_care_team on public.prayer_requests;
create policy requests_select_community_admin
on public.prayer_requests
for select
to authenticated
using ((select public.is_community_admin()));

drop policy if exists requests_update_care_team on public.prayer_requests;
create policy requests_update_community_admin
on public.prayer_requests
for update
to authenticated
using ((select public.is_community_admin()))
with check ((select public.is_community_admin()));

drop policy if exists categories_write_care_team on public.prayer_categories;
create policy categories_write_community_admin
on public.prayer_categories
for all
to authenticated
using ((select public.is_community_admin()))
with check ((select public.is_community_admin()));

drop policy if exists updates_all_care_team on public.prayer_updates;
create policy updates_all_community_admin
on public.prayer_updates
for all
to authenticated
using ((select public.is_community_admin()))
with check ((select public.is_community_admin()));
