-- L&F Live: persist the currently displayed teaching card for late joiners.
-- Existing session state access remains controlled by the authenticated API route.
alter table public.study_sessions
  add column if not exists live_overlay jsonb;

comment on column public.study_sessions.live_overlay is
  'Current facilitator-selected L&F Live teaching overlay; null means hidden.';
