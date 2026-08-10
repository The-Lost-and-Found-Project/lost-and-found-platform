begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.emmaus_discovery_progress'::regclass),
  'Emmaus progress remains protected by RLS'
);

select ok(has_table_privilege('authenticated', 'public.emmaus_discovery_progress', 'SELECT'), 'authenticated can load progress');
select ok(has_table_privilege('authenticated', 'public.emmaus_discovery_progress', 'INSERT'), 'authenticated can start progress');
select ok(has_table_privilege('authenticated', 'public.emmaus_discovery_progress', 'UPDATE'), 'authenticated can save progress');
select ok(has_table_privilege('authenticated', 'public.emmaus_discovery_progress', 'DELETE'), 'authenticated can restart progress');
select ok(not has_table_privilege('anon', 'public.emmaus_discovery_progress', 'SELECT'), 'anonymous visitors cannot read progress');

select * from finish();
rollback;
