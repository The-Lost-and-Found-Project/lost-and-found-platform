begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

create table public.profiles (
  id uuid primary key,
  full_name text,
  role text not null default 'member',
  faith_story text,
  favorite_scripture text,
  avatar_url text,
  email text,
  date_of_salvation date,
  date_of_baptism date,
  is_active boolean not null default true,
  preview_role text,
  gender text,
  phone text,
  rotation_status text not null default 'active',
  paused_at timestamptz,
  reinstatement_requested_at timestamptz
);

alter table public.profiles enable row level security;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

grant select, update on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

revoke update on table public.profiles from public, anon, authenticated;
grant update (
  full_name,
  faith_story,
  favorite_scripture,
  avatar_url,
  date_of_salvation,
  date_of_baptism,
  preview_role,
  gender,
  phone
) on table public.profiles to authenticated;

insert into public.profiles (id, full_name, role) values
  ('00000000-0000-0000-0000-000000000101', 'Member One', 'member'),
  ('00000000-0000-0000-0000-000000000102', 'Member Two', 'member');

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000101","role":"authenticated"}',
  true
);
set local role authenticated;

select ok(
  has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE'),
  'members retain permission to edit ordinary profile fields'
);

select ok(
  has_column_privilege('authenticated', 'public.profiles', 'avatar_url', 'UPDATE'),
  'members retain permission to edit their avatar'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE'),
  'members cannot update their authorization role'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'is_active', 'UPDATE'),
  'members cannot activate or deactivate accounts'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'rotation_status', 'UPDATE'),
  'members cannot alter prayer rotation status'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'paused_at', 'UPDATE'),
  'members cannot alter pause timestamps'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'reinstatement_requested_at', 'UPDATE'),
  'members cannot forge reinstatement requests'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE'),
  'members cannot change profile ownership'
);

select lives_ok(
  $$update public.profiles
    set full_name = 'Updated Member'
    where id = '00000000-0000-0000-0000-000000000101'$$,
  'an authenticated member can still update their own name'
);

select results_eq(
  $$update public.profiles
    set full_name = 'Not Allowed'
    where id = '00000000-0000-0000-0000-000000000102'
    returning 1$$,
  $$values (null::integer) limit 0$$,
  'RLS prevents a member from updating another profile'
);

reset role;
set local role service_role;

select lives_ok(
  $$update public.profiles
    set role = 'prayer_team', rotation_status = 'active'
    where id = '00000000-0000-0000-0000-000000000102'$$,
  'trusted service-role routes retain privileged update access'
);

select * from finish();
rollback;
