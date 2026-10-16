create table if not exists public.study_session_followup (
 session_id uuid primary key references public.study_sessions(id) on delete cascade,
 attendance_reviewed boolean not null default false,
 participant_followup_done boolean not null default false,
 resources_shared boolean not null default false,
 next_meeting_planned boolean not null default false,
 updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now()
);
alter table public.study_session_followup enable row level security;
comment on table public.study_session_followup is 'Meeting-level operational follow-up checklist. Individual pastoral care details must not be stored here.';
