create table if not exists public.devotional_push_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  study_session_id uuid not null references public.study_sessions(id) on delete cascade,
  local_time time not null default '10:00',
  timezone text not null default 'America/New_York',
  starts_on date not null default current_date,
  ends_on date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, study_session_id)
);

create table if not exists public.devotional_push_deliveries (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.devotional_push_reminders(id) on delete cascade,
  delivery_date date not null,
  notification_id uuid,
  created_at timestamptz not null default now(),
  unique(reminder_id, delivery_date)
);

do $migration$
begin
  if to_regclass('public.notifications') is not null
     and not exists (
       select 1 from pg_constraint
       where conname='devotional_push_deliveries_notification_id_fkey'
         and conrelid='public.devotional_push_deliveries'::regclass
     ) then
    alter table public.devotional_push_deliveries
      add constraint devotional_push_deliveries_notification_id_fkey
      foreign key (notification_id) references public.notifications(id) on delete set null;
  end if;
end
$migration$;

alter table public.devotional_push_reminders enable row level security;
alter table public.devotional_push_deliveries enable row level security;

create policy "members read own devotional reminders" on public.devotional_push_reminders
for select to authenticated using (user_id=auth.uid() or public.is_lfp_admin(auth.uid()));

create policy "admins manage devotional reminders" on public.devotional_push_reminders
for all to authenticated using (public.is_lfp_admin(auth.uid())) with check (public.is_lfp_admin(auth.uid()));

create policy "members read own devotional deliveries" on public.devotional_push_deliveries
for select to authenticated using (
  exists(select 1 from public.devotional_push_reminders r where r.id=reminder_id and (r.user_id=auth.uid() or public.is_lfp_admin(auth.uid())))
);
