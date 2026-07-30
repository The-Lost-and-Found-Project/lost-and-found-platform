begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

create table public.prayer_requests (
  id uuid primary key,
  prayer_count integer not null default 0,
  last_prayed_at timestamptz
);

create table public.prayer_reactions (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests(id),
  user_id uuid,
  anon_key text,
  activity_type text not null default 'prayed'
    check (activity_type = 'prayed'),
  client_request_id uuid not null,
  source text not null default 'prayer_wall',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint prayer_reactions_identity check (
    (user_id is not null and anon_key is null)
    or
    (user_id is null and nullif(btrim(anon_key), '') is not null)
  )
);

create unique index prayer_reactions_client_request_id_key
  on public.prayer_reactions (client_request_id);

create function public.handle_new_reaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.prayer_requests
  set prayer_count = prayer_count + 1,
      last_prayed_at = now()
  where id = new.prayer_request_id;
  return new;
end;
$$;

create trigger on_prayer_reaction_created
after insert on public.prayer_reactions
for each row execute function public.handle_new_reaction();

alter table public.prayer_reactions enable row level security;
grant insert on public.prayer_reactions to anon, authenticated;

create policy reactions_insert_valid_identity
on public.prayer_reactions
for insert
to anon, authenticated
with check (
  activity_type = 'prayed'
  and client_request_id is not null
  and (
    (
      (select auth.uid()) is not null
      and user_id = (select auth.uid())
      and anon_key is null
    )
    or
    (
      (select auth.uid()) is null
      and user_id is null
      and nullif(btrim(anon_key), '') is not null
    )
  )
);

insert into public.prayer_requests (id)
values ('00000000-0000-0000-0000-000000000401');

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000201","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  $$insert into public.prayer_reactions
    (prayer_request_id, user_id, client_request_id)
    values (
      '00000000-0000-0000-0000-000000000401',
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-4000-8000-000000000501'
    )$$,
  'a member can record one prayer activity'
);

select lives_ok(
  $$insert into public.prayer_reactions
    (prayer_request_id, user_id, client_request_id)
    values (
      '00000000-0000-0000-0000-000000000401',
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-4000-8000-000000000502'
    )$$,
  'the same member can pray for the same request again'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.prayer_reactions
    where prayer_request_id = '00000000-0000-0000-0000-000000000401'
  ),
  2,
  'each intentional prayer creates a separate activity'
);

select is(
  (
    select prayer_count
    from public.prayer_requests
    where id = '00000000-0000-0000-0000-000000000401'
  ),
  2,
  'the database trigger increments the count for every activity'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000201","role":"authenticated"}',
  true
);
set local role authenticated;

select throws_ok(
  $$insert into public.prayer_reactions
    (prayer_request_id, user_id, client_request_id)
    values (
      '00000000-0000-0000-0000-000000000401',
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-4000-8000-000000000502'
    )$$,
  '23505',
  null,
  'a retried client request cannot create a duplicate activity'
);

select throws_ok(
  $$insert into public.prayer_reactions
    (prayer_request_id, user_id, client_request_id)
    values (
      '00000000-0000-0000-0000-000000000401',
      '00000000-0000-0000-0000-000000000202',
      '00000000-0000-4000-8000-000000000503'
    )$$,
  '42501',
  null,
  'a member cannot record prayer activity for another user'
);

reset role;

select is(
  (
    select prayer_count
    from public.prayer_requests
    where id = '00000000-0000-0000-0000-000000000401'
  ),
  2,
  'failed and duplicate submissions do not increment the count'
);

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select lives_ok(
  $$insert into public.prayer_reactions
    (prayer_request_id, anon_key, client_request_id)
    values (
      '00000000-0000-0000-0000-000000000401',
      '00000000-0000-4000-8000-000000000601',
      '00000000-0000-4000-8000-000000000504'
    )$$,
  'the existing anonymous prayer behavior remains supported'
);

reset role;

select is(
  (
    select prayer_count
    from public.prayer_requests
    where id = '00000000-0000-0000-0000-000000000401'
  ),
  3,
  'an allowed anonymous activity increments the count once'
);

select ok(
  not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'prayer_reactions'
      and indexdef like '%(prayer_request_id, user_id)%'
  ),
  'there is no one-prayer-per-user uniqueness constraint'
);

select * from finish();
rollback;
