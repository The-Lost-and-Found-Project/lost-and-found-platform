-- Historical L&F core baseline.
-- The production project predates the repository migration history; later
-- migrations assume profiles and its auth-user trigger already exist.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'member',
  faith_story text,
  favorite_scripture text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  avatar_url text,
  email text,
  date_of_salvation date,
  date_of_baptism date,
  is_active boolean not null default true,
  preview_role text,
  gender text check (gender is null or gender in ('male','female')),
  phone text,
  welcome_email_sent_at timestamptz,
  rotation_status text not null default 'active'
    check (rotation_status in ('active','paused_neglect','paused_sabbatical','inactive')),
  paused_at timestamptz,
  reinstatement_requested_at timestamptz
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own_or_care_team on public.profiles;
create policy profiles_select_own_or_care_team
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select on table public.profiles to authenticated;
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, gender)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone',''),
    nullif(new.raw_user_meta_data ->> 'gender','')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
