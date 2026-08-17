-- Prayer requests are a signed-in Community Member action. The previous
-- public INSERT grant and policy allowed callers to bypass the app's
-- Turnstile check by writing directly to PostgREST with a null user_id.
-- Keep RLS authoritative and preserve every existing request.
do $migration$
begin
  if to_regclass('public.prayer_requests') is null
     or to_regclass('public.profiles') is null then
    raise notice 'Skipping prayer submission security: legacy prayer tables are not present.';
    return;
  end if;

  revoke insert on table public.prayer_requests from anon;

  drop policy if exists requests_insert_anyone on public.prayer_requests;
  drop policy if exists requests_insert_active_community_members on public.prayer_requests;

  create policy requests_insert_active_community_members
  on public.prayer_requests
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_active is true
    )
  );

  grant insert on table public.prayer_requests to authenticated;
end;
$migration$;
