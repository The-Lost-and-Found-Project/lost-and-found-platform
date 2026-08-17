-- The Prayer Care retirement revoked is_care_team(), but several RLS
-- policies still called it. PostgreSQL evaluates those policy expressions
-- even when the member is reading their own row, so profile and prayer reads
-- failed with permission denied instead of returning preserved data.
--
-- Replace only those stale policy dependencies. Community Members retain
-- access to their own records; Community Admins retain the same moderation
-- access; former Prayer Care roles gain no access.

-- These Community tables predate the repository's tracked migration baseline.
-- Fresh CI databases do not recreate that historical schema, so replace the
-- legacy policies only where every policy target already exists.
do $migration$
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.prayer_reactions') is null
     or to_regclass('public.prayer_requests') is null
     or to_regclass('public.prayer_categories') is null
     or to_regclass('public.prayer_updates') is null then
    raise notice 'Skipping Community policy replacement: legacy source tables are not present.';
    return;
  end if;

  execute $function$
    create or replace function public.is_community_admin()
    returns boolean
    language sql
    stable
    security definer
    set search_path = ''
    as $body$
      select exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and role = 'admin'
      );
    $body$
  $function$;

  execute 'revoke all on function public.is_community_admin()
    from public, anon, authenticated, service_role';

  execute 'grant execute on function public.is_community_admin()
    to authenticated, service_role';

  execute 'drop policy if exists profiles_select_own_or_care_team on public.profiles';
  execute 'create policy profiles_select_own_or_community_admin
    on public.profiles
    for select
    to authenticated
    using (auth.uid() = id or (select public.is_community_admin()))';

  execute 'drop policy if exists prayer_activities_select_own_or_care_team on public.prayer_reactions';
  execute 'create policy prayer_activities_select_own_or_community_admin
    on public.prayer_reactions
    for select
    to authenticated
    using (user_id = (select auth.uid()) or (select public.is_community_admin()))';

  execute 'drop policy if exists requests_select_care_team on public.prayer_requests';
  execute 'create policy requests_select_community_admin
    on public.prayer_requests
    for select
    to authenticated
    using ((select public.is_community_admin()))';

  execute 'drop policy if exists requests_update_care_team on public.prayer_requests';
  execute 'create policy requests_update_community_admin
    on public.prayer_requests
    for update
    to authenticated
    using ((select public.is_community_admin()))
    with check ((select public.is_community_admin()))';

  execute 'drop policy if exists categories_write_care_team on public.prayer_categories';
  execute 'create policy categories_write_community_admin
    on public.prayer_categories
    for all
    to authenticated
    using ((select public.is_community_admin()))
    with check ((select public.is_community_admin()))';

  execute 'drop policy if exists updates_all_care_team on public.prayer_updates';
  execute 'create policy updates_all_community_admin
    on public.prayer_updates
    for all
    to authenticated
    using ((select public.is_community_admin()))
    with check ((select public.is_community_admin()))';
end
$migration$;
