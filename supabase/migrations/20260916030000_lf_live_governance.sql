-- L&F Live governance foundation
-- 75 minute standard, justified +15, supervisor override, admin escalation.

alter table public.study_sessions
  add column if not exists live_started_at timestamptz,
  add column if not exists live_ended_at timestamptz,
  add column if not exists live_provider text,
  add column if not exists live_room_name text,
  add column if not exists live_participant_minutes integer not null default 0;

create table if not exists public.study_session_extensions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  extension_level text not null check (extension_level in ('facilitator_15','supervisor_15','admin_override')),
  reason text not null check (char_length(trim(reason)) >= 3),
  requested_minutes integer not null check (requested_minutes > 0),
  status text not null default 'approved' check (status in ('pending','approved','denied','escalated')),
  decided_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists study_session_extensions_session_idx on public.study_session_extensions(session_id, requested_at);
create index if not exists study_session_extensions_requester_idx on public.study_session_extensions(requested_by, requested_at);

alter table public.study_session_extensions enable row level security;

-- Access is intentionally server-action/admin-client mediated. This avoids exposing
-- extension reasons or supervisory decisions directly through the browser client.

create or replace view public.lf_live_monthly_usage as
select
  date_trunc('month', coalesce(live_started_at, scheduled_start)) as usage_month,
  count(*) filter (where live_started_at is not null) as live_sessions,
  coalesce(sum(live_participant_minutes),0)::bigint as participant_minutes
from public.study_sessions
group by 1;

comment on table public.study_session_extensions is 'Auditable L&F Live extension/override requests and decisions.';
comment on view public.lf_live_monthly_usage is 'Monthly L&F Live participant-minute rollup for cost governance.';
