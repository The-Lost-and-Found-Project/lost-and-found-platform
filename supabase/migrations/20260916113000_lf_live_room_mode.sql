alter table public.study_sessions
  add column if not exists live_room_mode text not null default 'gather'
  check (live_room_mode in ('gather','teach','discuss'));
