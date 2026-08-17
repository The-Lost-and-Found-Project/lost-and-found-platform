-- Keep the RLS-only Community Admin predicate out of the exposed public API
-- schema. Policies may execute it, but signed-in clients cannot call a public
-- SECURITY DEFINER RPC endpoint.

create schema if not exists community_security;

revoke all on schema community_security from public;
grant usage on schema community_security to authenticated, service_role;

create or replace function community_security.is_admin()
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

revoke all on function community_security.is_admin()
from public, anon, authenticated, service_role;

grant execute on function community_security.is_admin()
to authenticated, service_role;

alter policy profiles_select_own_or_community_admin
on public.profiles
using (auth.uid() = id or (select community_security.is_admin()));

alter policy prayer_activities_select_own_or_community_admin
on public.prayer_reactions
using (user_id = (select auth.uid()) or (select community_security.is_admin()));

alter policy requests_select_community_admin
on public.prayer_requests
using ((select community_security.is_admin()));

alter policy requests_update_community_admin
on public.prayer_requests
using ((select community_security.is_admin()))
with check ((select community_security.is_admin()));

alter policy categories_write_community_admin
on public.prayer_categories
using ((select community_security.is_admin()))
with check ((select community_security.is_admin()));

alter policy updates_all_community_admin
on public.prayer_updates
using ((select community_security.is_admin()))
with check ((select community_security.is_admin()));

revoke all on function public.is_community_admin()
from public, anon, authenticated, service_role;
