create or replace function public.is_emmaus_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if session_user = 'postgres' then
    return true;
  end if;

  return exists (
    select 1
    from public.companion_memberships
    where user_id = (select auth.uid())
      and role in ('owner', 'admin')
      and is_active
  );
end;
$$;

revoke all on function public.is_emmaus_admin() from public, anon;
grant execute on function public.is_emmaus_admin() to authenticated;
