-- EMAS is no longer part of the Community App runtime. Preserve every
-- function for its future standalone app, but close the direct Data API RPC
-- surface to Community members and signed-out visitors. Trusted server-side
-- access remains available through service_role.
do $migration$
declare
  function_record record;
begin
  for function_record in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like '%emmaus%'
  loop
    execute format(
      'revoke all on function %s from public, anon, authenticated',
      function_record.signature
    );
    execute format(
      'grant execute on function %s to service_role',
      function_record.signature
    );
  end loop;
end;
$migration$;
