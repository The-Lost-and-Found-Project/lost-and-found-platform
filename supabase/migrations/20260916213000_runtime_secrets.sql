create table if not exists public.app_runtime_secrets (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_runtime_secrets enable row level security;

-- Intentionally no authenticated/anon policies. The service-role client used
-- by server-only code bypasses RLS; browser clients cannot read this table.
comment on table public.app_runtime_secrets is 'Server-only runtime secrets available exclusively through the service-role client.';
