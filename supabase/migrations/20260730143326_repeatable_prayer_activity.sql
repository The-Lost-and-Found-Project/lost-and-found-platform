-- Evolve the existing prayer_reactions table into a repeatable activity log.
-- The guard keeps fresh local test databases usable because this repository's
-- historical production schema predates its tracked migration directory.
do $migration$
declare
  request_record record;
  missing_activity_count integer;
begin
  if to_regclass('public.prayer_reactions') is null
     or to_regclass('public.prayer_requests') is null then
    raise notice 'Skipping repeatable prayer migration: legacy prayer tables are not present.';
    return;
  end if;

  alter table public.prayer_reactions
    add column if not exists activity_type text,
    add column if not exists client_request_id uuid,
    add column if not exists source text,
    add column if not exists metadata jsonb;

  update public.prayer_reactions
  set activity_type = coalesce(activity_type, 'prayed'),
      client_request_id = coalesce(client_request_id, id),
      source = coalesce(source, 'legacy_reaction'),
      metadata = coalesce(metadata, '{}'::jsonb);

  alter table public.prayer_reactions
    alter column activity_type set default 'prayed',
    alter column activity_type set not null,
    alter column client_request_id set default gen_random_uuid(),
    alter column client_request_id set not null,
    alter column source set default 'prayer_wall',
    alter column source set not null,
    alter column metadata set default '{}'::jsonb,
    alter column metadata set not null;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.prayer_reactions'::regclass
      and conname = 'prayer_reactions_activity_type_check'
  ) then
    alter table public.prayer_reactions
      add constraint prayer_reactions_activity_type_check
      check (activity_type = 'prayed');
  end if;

  drop index if exists public.prayer_reactions_unique_user;
  drop index if exists public.prayer_reactions_unique_anon;

  create unique index if not exists prayer_reactions_client_request_id_key
    on public.prayer_reactions (client_request_id);
  create index if not exists prayer_reactions_request_created_idx
    on public.prayer_reactions (prayer_request_id, created_at desc);
  create index if not exists prayer_reactions_user_created_idx
    on public.prayer_reactions (user_id, created_at desc)
    where user_id is not null;

  -- Preserve any legacy count that predates its corresponding reaction row.
  -- Triggers are paused so backfilling does not send notifications or double
  -- increment the cached counter.
  alter table public.prayer_reactions
    disable trigger on_prayer_reaction_created;
  alter table public.prayer_reactions
    disable trigger on_prayer_reaction_created_notify;

  for request_record in
    select
      requests.id,
      requests.prayer_count,
      requests.created_at,
      requests.last_prayed_at,
      count(reactions.id)::integer as activity_count
    from public.prayer_requests requests
    left join public.prayer_reactions reactions
      on reactions.prayer_request_id = requests.id
    group by requests.id
  loop
    missing_activity_count :=
      greatest(request_record.prayer_count - request_record.activity_count, 0);

    if missing_activity_count > 0 then
      insert into public.prayer_reactions (
        prayer_request_id,
        user_id,
        anon_key,
        created_at,
        activity_type,
        client_request_id,
        source,
        metadata
      )
      select
        request_record.id,
        null,
        format(
          'legacy-count-backfill:%s:%s',
          request_record.id,
          generated.activity_number
        ),
        coalesce(request_record.last_prayed_at, request_record.created_at, now()),
        'prayed',
        gen_random_uuid(),
        'legacy_counter_backfill',
        jsonb_build_object('legacy_activity_number', generated.activity_number)
      from generate_series(1, missing_activity_count) as generated(activity_number);
    end if;
  end loop;

  alter table public.prayer_reactions
    enable trigger on_prayer_reaction_created;
  alter table public.prayer_reactions
    enable trigger on_prayer_reaction_created_notify;

  -- Reconcile the cached counter to the complete event history.
  update public.prayer_requests requests
  set prayer_count = activity_counts.prayer_count
  from (
    select prayer_request_id, count(*)::integer as prayer_count
    from public.prayer_reactions
    where activity_type = 'prayed'
    group by prayer_request_id
  ) activity_counts
  where requests.id = activity_counts.prayer_request_id
    and requests.prayer_count is distinct from activity_counts.prayer_count;

  update public.prayer_requests requests
  set prayer_count = 0
  where requests.prayer_count <> 0
    and not exists (
      select 1
      from public.prayer_reactions reactions
      where reactions.prayer_request_id = requests.id
        and reactions.activity_type = 'prayed'
    );

  drop policy if exists reactions_insert_valid_identity
    on public.prayer_reactions;
  execute $policy$
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
    )
  $policy$;

  drop policy if exists reactions_select_all
    on public.prayer_reactions;
  drop policy if exists prayer_activities_select_own_or_care_team
    on public.prayer_reactions;
  execute $policy$
    create policy prayer_activities_select_own_or_care_team
    on public.prayer_reactions
    for select
    to authenticated
    using (
      user_id = (select auth.uid())
      or (select public.is_care_team())
    )
  $policy$;

  revoke select on table public.prayer_reactions from anon;
  grant select, insert on table public.prayer_reactions to authenticated;
  grant insert on table public.prayer_reactions to anon;

  execute $function$
    create or replace function public.handle_new_reaction()
    returns trigger
    language plpgsql
    security definer
    set search_path = ''
    as $body$
    begin
      if new.activity_type = 'prayed' then
        update public.prayer_requests
        set prayer_count = prayer_count + 1,
            last_prayed_at = now()
        where id = new.prayer_request_id;
      end if;

      return new;
    end;
    $body$
  $function$;
end;
$migration$;
