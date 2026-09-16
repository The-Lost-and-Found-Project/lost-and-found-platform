do $$
declare c record;
begin
  for c in select conname from pg_constraint where conrelid='public.profiles'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%role%'
  loop execute format('alter table public.profiles drop constraint if exists %I', c.conname); end loop;
end $$;
alter table public.profiles add constraint profiles_role_allowed check (role in ('member','facilitator','supervisor','admin'));

create table if not exists public.facilitator_supervision (
  supervisor_user_id uuid not null references auth.users(id) on delete cascade,
  facilitator_user_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (supervisor_user_id, facilitator_user_id),
  check (supervisor_user_id <> facilitator_user_id)
);
create index if not exists facilitator_supervision_facilitator_idx on public.facilitator_supervision(facilitator_user_id);
alter table public.facilitator_supervision enable row level security;
create policy "admins manage facilitator supervision" on public.facilitator_supervision for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "supervisors read own supervision" on public.facilitator_supervision for select to authenticated using (supervisor_user_id=auth.uid() or facilitator_user_id=auth.uid());
