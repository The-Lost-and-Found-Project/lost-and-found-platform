-- Make push delivery single-worker per notification and retry transient failures
-- using the existing five-minute cron. No new scheduler or provider is added.
alter table public.notifications
  add column if not exists push_attempt_count integer not null default 0,
  add column if not exists push_next_attempt_at timestamptz,
  add column if not exists push_claim_token uuid,
  add column if not exists push_claimed_until timestamptz,
  add column if not exists push_delivered_subscription_ids uuid[] not null default '{}'::uuid[],
  add column if not exists push_delivery_uncertain boolean not null default false;

create index if not exists notifications_push_retry_due_idx
  on public.notifications (push_status, push_next_attempt_at, created_at)
  where push_status in ('pending', 'failed');

create or replace function public.claim_notification_push_delivery(p_notification_id uuid)
returns table (
  id uuid,
  user_id uuid,
  title text,
  body text,
  link text,
  claim_token uuid,
  attempt_count integer,
  delivered_subscription_ids uuid[]
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  -- An expired lease means the worker may have sent externally but failed to
  -- record the result. Stop automatic retries and require an audited decision.
  update public.notifications as n
  set push_status = 'failed',
      push_delivery_uncertain = true,
      push_next_attempt_at = null,
      push_error = 'Outcome uncertain after worker lease expired. Automatic retry paused; administrator reconciliation required.',
      push_claim_token = null,
      push_claimed_until = null
  where n.id = p_notification_id
    and n.push_status in ('pending', 'failed')
    and n.push_claim_token is not null
    and n.push_claimed_until <= now()
    and not n.push_delivery_uncertain;

  return query
  update public.notifications as n
  set push_claim_token = gen_random_uuid(),
      push_claimed_until = now() + interval '10 minutes',
      push_attempt_count = n.push_attempt_count + 1,
      push_attempted_at = now()
  where n.id = p_notification_id
    and n.push_status in ('pending', 'failed')
    and (n.push_next_attempt_at is null or n.push_next_attempt_at <= now())
    and n.push_claimed_until is null
    and not n.push_delivery_uncertain
    and n.push_attempt_count < 8
  returning n.id, n.user_id, n.title, n.body, n.link,
    n.push_claim_token, n.push_attempt_count, n.push_delivered_subscription_ids;
end;
$function$;

create or replace function public.complete_notification_push_delivery(
  p_notification_id uuid,
  p_claim_token uuid,
  p_status text,
  p_error text default null,
  p_delivered_subscription_ids uuid[] default '{}'::uuid[]
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  changed integer;
begin
  if p_status not in ('sent', 'skipped', 'failed') then
    raise exception 'Invalid push delivery status';
  end if;

  update public.notifications as n
  set push_status = p_status,
      push_delivery_uncertain = false,
      push_delivered_at = case when p_status = 'sent' then now() else null end,
      push_error = p_error,
      push_delivered_subscription_ids = array(
        select distinct delivered_id
        from unnest(n.push_delivered_subscription_ids || coalesce(p_delivered_subscription_ids, '{}'::uuid[]))
          as delivered(delivered_id)
      ),
      push_next_attempt_at = case
        when p_status = 'failed' and n.push_attempt_count < 8
        then now() + make_interval(
          mins => least(1440, (5 * power(2, greatest(0, n.push_attempt_count - 1)))::integer)
        )
        else null
      end,
      push_claim_token = null,
      push_claimed_until = null
  where n.id = p_notification_id
    and n.push_claim_token = p_claim_token;

  get diagnostics changed = row_count;
  return changed = 1;
end;
$function$;

revoke all on function public.claim_notification_push_delivery(uuid) from public, anon, authenticated;
revoke all on function public.complete_notification_push_delivery(uuid, uuid, text, text, uuid[]) from public, anon, authenticated;
grant execute on function public.claim_notification_push_delivery(uuid) to service_role;
grant execute on function public.complete_notification_push_delivery(uuid, uuid, text, text, uuid[]) to service_role;

create table public.notification_push_reconciliations (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action = 'retry_after_review'),
  reason text not null check (length(btrim(reason)) between 12 and 500),
  created_at timestamptz not null default now()
);

alter table public.notification_push_reconciliations enable row level security;
revoke all on table public.notification_push_reconciliations from public, anon, authenticated;
grant select, insert on table public.notification_push_reconciliations to service_role;

create or replace function public.requeue_uncertain_notification_push(
  p_notification_id uuid,
  p_actor_user_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  reconciled_id uuid;
begin
  if p_actor_user_id is null or length(btrim(coalesce(p_reason, ''))) not between 12 and 500 then
    raise exception 'A valid administrator and reconciliation note are required';
  end if;

  update public.notifications as n
  set push_status = 'failed',
      push_delivery_uncertain = false,
      push_attempt_count = 0,
      push_next_attempt_at = now(),
      push_claim_token = null,
      push_claimed_until = null,
      push_error = 'Administrator released this notification for retry after review; see reconciliation audit.'
  where n.id = p_notification_id
    and n.push_delivery_uncertain = true
  returning n.id into reconciled_id;

  if reconciled_id is null then
    return false;
  end if;

  insert into public.notification_push_reconciliations (
    notification_id, actor_user_id, action, reason
  ) values (
    reconciled_id, p_actor_user_id, 'retry_after_review', btrim(p_reason)
  );

  return true;
end;
$function$;

revoke all on function public.requeue_uncertain_notification_push(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.requeue_uncertain_notification_push(uuid, uuid, text) to service_role;

drop function if exists public.get_notification_delivery_health();
create function public.get_notification_delivery_health()
returns table (
  failed_count bigint,
  pending_overdue_count bigint,
  uncertain_count bigint
)
language sql
security definer
set search_path = ''
as $function$
  select
    count(*) filter (
      where n.push_status = 'failed'
        and not n.push_delivery_uncertain
        and n.created_at >= now() - interval '7 days'
    ),
    count(*) filter (
      where n.push_status = 'pending'
        and n.created_at <= now() - interval '5 minutes'
    ),
    count(*) filter (where n.push_delivery_uncertain)
  from public.notifications as n;
$function$;

revoke all on function public.get_notification_delivery_health() from public, anon, authenticated;
grant execute on function public.get_notification_delivery_health() to service_role;
