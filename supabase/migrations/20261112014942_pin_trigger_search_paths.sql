-- Local and Production schemas differ for legacy Rare trigger helpers.
-- Pin only functions present in the target database, without creating missing ones.
do $$
declare fn text;
begin
  foreach fn in array array[
    'public.prevent_locked_group_response_change()',
    'public.rare_prevent_locked_group_response_change()',
    'public.enforce_giving_campaign_activation_compliance()'
  ] loop
    if to_regprocedure(fn) is not null then
      execute format('alter function %s set search_path = %L', fn, '');
    end if;
  end loop;
end $$;
