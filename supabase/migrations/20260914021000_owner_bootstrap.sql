-- One-time bootstrap for the first Platform 2.0 Owner.
-- Only a legacy profiles.role='admin' account may claim, and only while no active owner exists.

create function public.claim_initial_platform_owner()
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  lock table public.platform_role_assignments in share row exclusive mode;
  if exists(select 1 from public.platform_role_assignments where role_key='owner' and revoked_at is null) then
    raise exception 'Platform Owner already exists';
  end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then
    raise exception 'Only an existing administrator may bootstrap the initial Owner';
  end if;
  insert into public.platform_role_assignments(user_id,role_key,granted_by,granted_at,revoked_at)
  values(auth.uid(),'owner',auth.uid(),now(),null)
  on conflict(user_id,role_key) do update set granted_by=auth.uid(),granted_at=now(),revoked_at=null;
end;
$$;

grant execute on function public.claim_initial_platform_owner() to authenticated;
comment on function public.claim_initial_platform_owner() is 'One-time migration bridge: first legacy admin claims Owner only while no active Owner exists.';
