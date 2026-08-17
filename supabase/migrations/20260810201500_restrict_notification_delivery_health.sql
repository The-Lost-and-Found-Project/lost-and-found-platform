-- The admin page is server-rendered after its role gate, so the aggregate can
-- be service-role-only instead of exposing a SECURITY DEFINER RPC to every
-- authenticated account.
do $migration$
begin
  if to_regclass('public.notifications') is null then
    raise notice 'Skipping notification delivery restriction: legacy notifications are not present.';
    return;
  end if;

execute $function$
create or replace function public.get_notification_delivery_health()
returns table (failed_count bigint, pending_overdue_count bigint)
language sql
security invoker
set search_path = ''
as $body$
  select
    count(*) filter (
      where n.push_status = 'failed'
        and n.created_at >= now() - interval '7 days'
    ),
    count(*) filter (
      where n.push_status = 'pending'
        and n.created_at <= now() - interval '5 minutes'
    )
  from public.notifications n;
$body$;
$function$;

revoke all on function public.get_notification_delivery_health() from public;
revoke all on function public.get_notification_delivery_health() from anon;
revoke all on function public.get_notification_delivery_health() from authenticated;
grant execute on function public.get_notification_delivery_health() to service_role;
end;
$migration$;
