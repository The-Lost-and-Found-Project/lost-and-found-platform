create table if not exists public.study_session_attendance (
 session_id uuid not null references public.study_sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null check (status in ('present','absent','excused')),
 recorded_by uuid not null references auth.users(id),
 recorded_at timestamptz not null default now(),
 primary key(session_id,user_id)
);
create index if not exists study_session_attendance_user_idx on public.study_session_attendance(user_id);
alter table public.study_session_attendance enable row level security;
comment on table public.study_session_attendance is 'Facilitator-recorded attendance, separate from RSVP and observed L&F Live presence. Access via authorized server actions only.';
