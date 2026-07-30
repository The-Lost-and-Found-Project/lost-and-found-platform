begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text,
  email text,
  phone text,
  request_text text not null,
  is_public boolean not null default true,
  is_anonymous boolean not null default false,
  moderation_status text not null default 'pending',
  archived boolean not null default false
);

alter table public.prayer_requests enable row level security;
grant select on public.prayer_requests to anon, authenticated;

create policy requests_select_public
on public.prayer_requests
for select
to anon, authenticated
using (is_public = true);

create view public.prayer_wall_public
with (security_barrier = true)
as
select
  id,
  request_text,
  case when is_anonymous then null::text else name end as display_name
from public.prayer_requests
where is_public = true
  and moderation_status = 'approved'
  and archived = false;

drop policy if exists requests_select_public on public.prayer_requests;

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'prayer_requests'
      and policyname = 'requests_select_public'
  ),
  'public callers cannot read contact fields from the prayer request table'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'prayer_wall_public'
      and column_name in ('email', 'phone', 'user_id')
  ),
  'the public prayer projection excludes contact and owner fields'
);

select ok(
  exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'prayer_wall_public'
      and 'security_barrier=true' = any(c.reloptions)
  ),
  'the public prayer projection is a security-barrier view'
);

select ok(
  not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'prayer_wall_public'
      and 'security_invoker=true' = any(c.reloptions)
  ),
  'the narrow projection does not require direct base-table access'
);

create table public.prayer_reactions (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null,
  user_id uuid,
  anon_key text
);

alter table public.prayer_reactions enable row level security;
grant insert, select on public.prayer_reactions to anon, authenticated;

create policy reactions_insert_valid_identity
on public.prayer_reactions
for insert
to anon, authenticated
with check (
  (auth.uid() is not null and user_id = auth.uid() and anon_key is null)
  or
  (auth.uid() is null and user_id is null and nullif(btrim(anon_key), '') is not null)
);

alter table public.prayer_reactions
  add constraint prayer_reactions_identity check (
    (user_id is not null and anon_key is null)
    or
    (user_id is null and nullif(btrim(anon_key), '') is not null)
  );

select results_eq(
  $$select roles from pg_policies
    where schemaname = 'public'
      and tablename = 'prayer_reactions'
      and policyname = 'reactions_insert_valid_identity'$$,
  $$values (array['anon', 'authenticated']::name[])$$,
  'only browser API roles receive the reaction insert policy'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'prayer_reactions'
      and cmd = 'INSERT'
      and with_check = 'true'
  ),
  'reaction insertion is never guarded by an always-true policy'
);

select matches(
  pg_get_constraintdef(
    (
      select oid
      from pg_constraint
      where conrelid = 'public.prayer_reactions'::regclass
        and conname = 'prayer_reactions_identity'
    )
  ),
  'user_id IS NOT NULL.*anon_key IS NULL.*user_id IS NULL.*anon_key',
  'the reaction identity constraint requires exactly one valid identity'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000201","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  $$insert into public.prayer_reactions
    (prayer_request_id, user_id)
    values (
      '00000000-0000-0000-0000-000000000301',
      '00000000-0000-0000-0000-000000000201'
    )$$,
  'a signed-in member can record their own reaction'
);

reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select lives_ok(
  $$insert into public.prayer_reactions
    (prayer_request_id, anon_key)
    values (
      '00000000-0000-0000-0000-000000000302',
      'browser-identity'
    )$$,
  'an anonymous visitor can react with a nonblank browser identity'
);

reset role;

drop policy if exists avatars_public_read on storage.objects;
drop policy if exists avatars_select_own on storage.objects;
create policy avatars_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_public_read'
  ),
  'the avatar bucket has no broad listing policy'
);

select results_eq(
  $$select roles from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_select_own'$$,
  $$values (array['authenticated']::name[])$$,
  'only signed-in owners receive avatar metadata SELECT access'
);

select matches(
  (
    select qual
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_select_own'
  ),
  'bucket_id.*avatars.*foldername.*auth.uid',
  'avatar SELECT access is limited to the caller folder'
);

create table public.profiles (
  id uuid primary key,
  role text not null
);

create function public.is_care_team()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('prayer_team', 'pastor', 'admin')
  );
$$;

create table public.trivia_questions (
  id uuid primary key,
  category_id text,
  status text
);

create function public.get_quiz_questions(text, integer)
returns setof public.trivia_questions
language sql
stable
as $$
  select *
  from public.trivia_questions
  where category_id = $1 and status = 'approved'
  limit $2;
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.id = new.id;
  return new;
end;
$$;

alter function public.is_care_team() set search_path = '';
alter function public.get_quiz_questions(text, integer) set search_path = '';
alter function public.set_updated_at() set search_path = '';

select results_eq(
  $$select coalesce(proconfig, array[]::text[])
    from pg_proc
    where oid = 'public.is_care_team()'::regprocedure$$,
  $$values (array['search_path=']::text[])$$,
  'is_care_team has an immutable empty search path'
);

select results_eq(
  $$select coalesce(proconfig, array[]::text[])
    from pg_proc
    where oid = 'public.get_quiz_questions(text,integer)'::regprocedure$$,
  $$values (array['search_path=']::text[])$$,
  'get_quiz_questions has an immutable empty search path'
);

select results_eq(
  $$select coalesce(proconfig, array[]::text[])
    from pg_proc
    where oid = 'public.set_updated_at()'::regprocedure$$,
  $$values (array['search_path=']::text[])$$,
  'set_updated_at has an immutable empty search path'
);

select * from finish();
rollback;
