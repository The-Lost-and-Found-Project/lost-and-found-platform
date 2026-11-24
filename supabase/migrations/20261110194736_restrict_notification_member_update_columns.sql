-- Members may acknowledge their own notifications, but must not rewrite
-- trusted notification content, recipient, or push delivery status.
-- The existing per-user SELECT and UPDATE RLS policies still apply.
-- Preserve service_role privileges for queue and push delivery jobs.
do $notification_column_access$
begin
 if to_regclass('public.notifications') is null then
  raise exception 'public.notifications must exist before restricting member updates';
 end if;
 revoke update on table public.notifications from public, anon, authenticated;
 grant update (read_at) on public.notifications to authenticated;
 grant select, insert, update, delete on table public.notifications to service_role;
end;
$notification_column_access$;
