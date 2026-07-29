begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

create table public.profiles (
  id uuid primary key,
  role text not null default 'member',
  is_active boolean not null default true,
  gender text,
  rotation_status text not null default 'active',
  paused_at timestamptz,
  reinstatement_requested_at timestamptz
);

create table public.care_team_rotation (
  id integer primary key default 1,
  last_assigned_to uuid
);

create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  assigned_to uuid,
  contact_requested boolean not null default false,
  preferred_care_gender text
);

insert into public.care_team_rotation (id, last_assigned_to) values (1, null);

create or replace function public.reassign_prayer_request(
  request_id uuid,
  exclude_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  pool uuid[];
  last_id uuid;
  last_pos int;
  next_id uuid;
  want_gender text;
  req record;
begin
  select * into req
  from public.prayer_requests
  where id = request_id
  for update;

  if req.id is null then
    return null;
  end if;

  want_gender := null;
  if req.contact_requested is true and req.preferred_care_gender is not null then
    want_gender := req.preferred_care_gender;
  end if;

  if want_gender is not null then
    select array_agg(id order by id)
    into pool
    from public.profiles
    where role in ('admin', 'prayer_team', 'pastor')
      and rotation_status = 'active'
      and coalesce(is_active, true) = true
      and gender = want_gender
      and id is distinct from req.user_id
      and id is distinct from exclude_user_id;
  end if;

  if pool is null or array_length(pool, 1) = 0 then
    select array_agg(id order by id)
    into pool
    from public.profiles
    where role in ('admin', 'prayer_team', 'pastor')
      and rotation_status = 'active'
      and coalesce(is_active, true) = true
      and id is distinct from req.user_id
      and id is distinct from exclude_user_id;
  end if;

  if pool is null or array_length(pool, 1) = 0 then
    update public.prayer_requests
    set assigned_to = null
    where id = request_id;
    return null;
  end if;

  select last_assigned_to
  into last_id
  from public.care_team_rotation
  where id = 1
  for update;

  last_pos := null;
  if last_id is not null then
    select ord
    into last_pos
    from unnest(pool) with ordinality as t(val, ord)
    where val = last_id;
  end if;

  if last_pos is null or last_pos >= array_length(pool, 1) then
    next_id := pool[1];
  else
    next_id := pool[last_pos + 1];
  end if;

  update public.prayer_requests
  set assigned_to = next_id
  where id = request_id;

  update public.care_team_rotation
  set last_assigned_to = next_id
  where id = 1;

  return next_id;
end;
$function$;

insert into public.profiles (id, role, gender, rotation_status, is_active) values
  ('00000000-0000-0000-0000-000000000001', 'member', 'female', 'active', true),
  ('00000000-0000-0000-0000-000000000002', 'prayer_team', 'male', 'active', true),
  ('00000000-0000-0000-0000-000000000003', 'prayer_team', 'male', 'active', true),
  ('00000000-0000-0000-0000-000000000004', 'prayer_team', 'female', 'active', true),
  ('00000000-0000-0000-0000-000000000005', 'prayer_team', 'female', 'paused_sabbatical', true),
  ('00000000-0000-0000-0000-000000000006', 'admin', 'female', 'active', false);

insert into public.prayer_requests (
  id,
  user_id,
  assigned_to,
  contact_requested,
  preferred_care_gender
) values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  true,
  'female'
);

select is(
  public.reassign_prayer_request(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
  )::text,
  '00000000-0000-0000-0000-000000000004',
  'reassignment honors the requested care-team gender'
);

select is(
  (select assigned_to::text from public.prayer_requests where id = '10000000-0000-0000-0000-000000000001'),
  '00000000-0000-0000-0000-000000000004',
  'reassignment updates the prayer request'
);

select is(
  (select last_assigned_to::text from public.care_team_rotation where id = 1),
  '00000000-0000-0000-0000-000000000004',
  'reassignment advances the rotation cursor'
);

select isnt(
  (select assigned_to::text from public.prayer_requests where id = '10000000-0000-0000-0000-000000000001'),
  '00000000-0000-0000-0000-000000000001',
  'the requester is excluded from assignment'
);

select isnt(
  (select assigned_to::text from public.prayer_requests where id = '10000000-0000-0000-0000-000000000001'),
  '00000000-0000-0000-0000-000000000002',
  'the previous assignee is excluded from reassignment'
);

select isnt(
  (select assigned_to::text from public.prayer_requests where id = '10000000-0000-0000-0000-000000000001'),
  '00000000-0000-0000-0000-000000000005',
  'a sabbatical member is excluded'
);

select isnt(
  (select assigned_to::text from public.prayer_requests where id = '10000000-0000-0000-0000-000000000001'),
  '00000000-0000-0000-0000-000000000006',
  'a disabled member is excluded'
);

update public.profiles
set rotation_status = 'paused_neglect', paused_at = now()
where id = '00000000-0000-0000-0000-000000000002';

select is(
  (select rotation_status from public.profiles where id = '00000000-0000-0000-0000-000000000002'),
  'paused_neglect',
  'neglect pause is persisted'
);

update public.profiles
set rotation_status = 'inactive', reinstatement_requested_at = now()
where id = '00000000-0000-0000-0000-000000000002';

select ok(
  (select reinstatement_requested_at is not null from public.profiles where id = '00000000-0000-0000-0000-000000000002'),
  'inactive members can carry a reinstatement request'
);

update public.profiles
set rotation_status = 'active',
    paused_at = null,
    reinstatement_requested_at = null
where id = '00000000-0000-0000-0000-000000000002';

select is(
  (select rotation_status from public.profiles where id = '00000000-0000-0000-0000-000000000002'),
  'active',
  'admin approval restores active rotation status'
);

select ok(
  (select paused_at is null and reinstatement_requested_at is null from public.profiles where id = '00000000-0000-0000-0000-000000000002'),
  'admin approval clears pause and reinstatement timestamps'
);

update public.profiles
set rotation_status = 'paused_neglect'
where id in (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004'
);

select is(
  public.reassign_prayer_request(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
  ),
  null::uuid,
  'reassignment returns null when nobody eligible remains'
);

select * from finish();
rollback;
