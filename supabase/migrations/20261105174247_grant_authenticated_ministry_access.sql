-- RLS policies do not grant table privileges. Restore only the operations
-- the signed-in ministry and study surfaces use, leaving anon unprivileged.
do $migration$
declare table_name text;
begin
  foreach table_name in array array[
    'ministry_content','ministry_memberships','bible_studies',
    'study_sessions','study_session_participants'
  ] loop
    if to_regclass(format('public.%I',table_name)) is not null then
      execute format('grant select on table public.%I to authenticated',table_name);
    end if;
  end loop;

  if to_regclass('public.ministry_memberships') is not null then
    grant insert, update, delete on table public.ministry_memberships to authenticated;
    -- The existing member INSERT policy only permits joining oneself as a
    -- member. Leader assignment needs a separate admin-only INSERT policy.
    if to_regclass('public.profiles') is not null and not exists (
      select 1 from pg_policies where schemaname='public'
       and tablename='ministry_memberships' and policyname='admins insert ministry memberships'
    ) then
      execute $policy$
        create policy "admins insert ministry memberships"
          on public.ministry_memberships for insert to authenticated
          with check (exists (
            select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role = 'admin'
          ))
      $policy$;
    end if;
  end if;

  if to_regclass('public.ministry_content') is not null then
    -- Existing RLS policies limit writes to admins and scoped leaders.
    grant insert, update, delete on table public.ministry_content to authenticated;
  end if;
end;
$migration$;
