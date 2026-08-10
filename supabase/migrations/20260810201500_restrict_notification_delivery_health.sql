-- The admin page is server-rendered after its role gate, so the aggregate can
-- be service-role-only instead of exposing a SECURITY DEFINER RPC to every
-- authenticated account.
create or replace function public.get_notification_delivery_health()
returns table (failed_count bigint, pending_overdue_count bigint)
language sql
security invoker
set search_path = ''
as $$
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
$$;

revoke all on function public.get_notification_delivery_health() from public;
revoke all on function public.get_notification_delivery_health() from anon;
revoke all on function public.get_notification_delivery_health() from authenticated;
grant execute on function public.get_notification_delivery_health() to service_role;
