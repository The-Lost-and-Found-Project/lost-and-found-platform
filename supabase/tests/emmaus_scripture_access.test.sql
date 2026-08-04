begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.emmaus_scripture_nodes'::regclass),
  'Scripture rows remain protected by RLS'
);

select ok(
  has_table_privilege('authenticated', 'public.emmaus_scripture_nodes', 'SELECT'),
  'signed-in users can reach published Scripture through the Data API'
);

select ok(
  not has_table_privilege('anon', 'public.emmaus_scripture_nodes', 'SELECT'),
  'anonymous visitors cannot query the Scripture corpus'
);

select * from finish();
rollback;
