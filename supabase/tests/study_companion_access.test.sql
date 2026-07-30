begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

select has_table(
  'public',
  'companion_memberships',
  'Companion memberships are separate from ministry profiles'
);
select has_table('public', 'companion_features', 'Companion feature catalog exists');
select has_table(
  'public',
  'companion_role_features',
  'role-level Companion feature limits exist'
);
select has_table(
  'public',
  'companion_user_preferences',
  'per-user Companion preferences exist'
);

select ok(
  (
    select bool_and(relrowsecurity)
    from pg_class
    where oid in (
      'public.companion_memberships'::regclass,
      'public.companion_features'::regclass,
      'public.companion_role_features'::regclass,
      'public.companion_user_preferences'::regclass
    )
  ),
  'RLS is enabled on every Companion table'
);

select ok(
  not has_table_privilege(
    'anon',
    'public.companion_memberships',
    'SELECT'
  ),
  'anonymous visitors cannot inspect Companion access'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.companion_memberships',
    'INSERT'
  ),
  'members cannot grant Companion roles'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.companion_role_features',
    'UPDATE'
  ),
  'members cannot change role feature limits'
);

insert into auth.users (id, email)
values
  (
    '00000000-0000-0000-0000-000000000801',
    'companion-owner@example.test'
  ),
  (
    '00000000-0000-0000-0000-000000000802',
    'companion-beta@example.test'
  );

insert into public.companion_memberships (user_id, role)
values
  ('00000000-0000-0000-0000-000000000801', 'owner'),
  ('00000000-0000-0000-0000-000000000802', 'beta');

select throws_ok(
  $$insert into public.companion_memberships (user_id, role)
    values ('00000000-0000-0000-0000-000000000802', 'owner')
    on conflict (user_id) do update set role = excluded.role$$,
  '23505',
  null,
  'only one active owner can exist'
);

insert into public.companion_user_preferences
  (user_id, feature_key, enabled)
values
  ('00000000-0000-0000-0000-000000000802', 'chat', false);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000801","role":"authenticated"}',
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.companion_memberships),
  1,
  'an owner can only read their own Companion membership'
);
select is(
  (select role from public.companion_memberships),
  'owner',
  'the visible Companion membership is the caller'
);
select is(
  (select count(*)::integer from public.companion_role_features),
  20,
  'signed-in users can read role feature limits'
);
select is(
  (select count(*)::integer from public.companion_user_preferences),
  0,
  'an owner cannot read another user preference'
);

select lives_ok(
  $$insert into public.companion_user_preferences
      (user_id, feature_key, enabled)
    values (
      '00000000-0000-0000-0000-000000000801',
      'chat',
      false
    )$$,
  'an owner can customize an allowed feature'
);

select lives_ok(
  $$update public.companion_user_preferences
    set enabled = true
    where user_id = '00000000-0000-0000-0000-000000000801'
      and feature_key = 'chat'$$,
  'an owner can update their own allowed preference'
);

select throws_ok(
  $$insert into public.companion_user_preferences
      (user_id, feature_key, enabled)
    values (
      '00000000-0000-0000-0000-000000000802',
      'guided_study',
      true
    )$$,
  '42501',
  null,
  'an owner cannot write another user preference'
);

select throws_ok(
  $$update public.companion_role_features
    set allowed = true
    where role = 'beta' and feature_key = 'chat'$$,
  '42501',
  null,
  'browser clients cannot expand role feature limits'
);

select * from finish();

rollback;
