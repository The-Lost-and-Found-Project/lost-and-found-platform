-- Finish retiring Prayer Care by moving every historical notification away
-- from removed member routes and closing the obsolete role-check RPC.
do $migration$
begin
  if to_regclass('public.notifications') is not null then
    update public.notifications
    set link = case
      when link = '/my-journey' then '/prayer/my-requests'
      else '/prayer'
    end
    where link in ('/my-journey', '/prayer-assignments', '/prayer-care-application');
  end if;

  if to_regprocedure('public.is_care_team()') is not null then
    revoke all on function public.is_care_team()
      from public, anon, authenticated, service_role;
  end if;
end;
$migration$;
