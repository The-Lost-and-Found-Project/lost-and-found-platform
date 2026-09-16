-- Native L&F Live room runtime state and participant-minute presence accounting.
alter table public.study_sessions
  add column if not exists live_slide_index integer not null default 0 check (live_slide_index >= 0),
  add column if not exists live_slide_updated_at timestamptz;

create table if not exists public.study_session_live_presence (
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (session_id,user_id)
);
create index if not exists study_session_live_presence_session_idx on public.study_session_live_presence(session_id,last_seen_at);
alter table public.study_session_live_presence enable row level security;
-- Presence is mediated by authenticated server routes using the admin client so
-- participant timing details are not exposed directly through the browser API.
