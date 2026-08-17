-- Add author-safe reactions for Community content. Prayer remains repeatable;
-- Praise Loves and Testimony Encouragements remain unique and removable.
-- Existing content, reactions, and notification history are preserved.
do $migration$
begin
  if to_regclass('public.prayer_requests') is null
     or to_regclass('public.prayer_reactions') is null
     or to_regclass('public.praise_reports') is null
     or to_regclass('public.praise_loves') is null
     or to_regclass('public.testimonies') is null
     or to_regclass('public.profiles') is null
     or to_regclass('public.user_settings') is null
     or to_regclass('public.notifications') is null then
    raise notice 'Skipping Community reaction migration: legacy Community tables are not present.';
    return;
  end if;

  alter table public.user_settings
    add column if not exists praise_reaction_notifications boolean not null default true,
    add column if not exists testimony_reaction_notifications boolean not null default true;

  alter table public.testimonies
    add column if not exists encouragement_count integer not null default 0;

  alter table public.testimonies
    drop constraint if exists testimonies_encouragement_count_check;

  alter table public.testimonies
    add constraint testimonies_encouragement_count_check
    check (encouragement_count >= 0);

  create table if not exists public.testimony_encouragements (
    id uuid primary key default gen_random_uuid(),
    testimony_id uuid not null references public.testimonies(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint testimony_encouragements_one_per_member unique (testimony_id, user_id)
  );

  create index if not exists testimony_encouragements_user_id_idx
    on public.testimony_encouragements (user_id);

  alter table public.testimony_encouragements enable row level security;

  drop policy if exists testimony_encouragements_select_own on public.testimony_encouragements;
  create policy testimony_encouragements_select_own
  on public.testimony_encouragements
  for select
  to authenticated
  using (user_id = (select auth.uid()));

  drop policy if exists testimony_encouragements_insert_own on public.testimony_encouragements;
  create policy testimony_encouragements_insert_own
  on public.testimony_encouragements
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_active is true
    )
    and exists (
      select 1 from public.testimonies
      where testimonies.id = testimony_encouragements.testimony_id
        and testimonies.moderation_status = 'approved'
        and testimonies.user_id is distinct from (select auth.uid())
    )
  );

  drop policy if exists testimony_encouragements_delete_own on public.testimony_encouragements;
  create policy testimony_encouragements_delete_own
  on public.testimony_encouragements
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

  revoke all on table public.testimony_encouragements from public, anon;
  grant select, insert, delete on table public.testimony_encouragements to authenticated;
  grant select, insert, update, delete on table public.testimony_encouragements to service_role;

  -- Enforce author blocking in the database even if a client bypasses the UI.
  drop policy if exists reactions_insert_valid_identity on public.prayer_reactions;
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
        and not exists (
          select 1 from public.prayer_requests
          where prayer_requests.id = prayer_reactions.prayer_request_id
            and prayer_requests.user_id = (select auth.uid())
        )
      )
      or
      (
        (select auth.uid()) is null
        and user_id is null
        and nullif(btrim(anon_key), '') is not null
      )
    )
  );

  drop policy if exists praise_loves_insert_own on public.praise_loves;
  create policy praise_loves_insert_own
  on public.praise_loves
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_active is true
    )
    and exists (
      select 1 from public.praise_reports
      where praise_reports.id = praise_loves.praise_report_id
        and praise_reports.moderation_status = 'approved'
        and praise_reports.user_id is distinct from (select auth.uid())
    )
  );

  alter table public.notifications
    add column if not exists reaction_actor_user_id uuid references auth.users(id) on delete set null,
    add column if not exists reaction_source_id uuid;

  create unique index if not exists notifications_unique_community_reaction
    on public.notifications (user_id, type, reaction_source_id, reaction_actor_user_id)
    where type in ('praise_loved', 'testimony_encouraged')
      and reaction_source_id is not null
      and reaction_actor_user_id is not null;

  execute $function$
  create or replace function public.update_testimony_encouragement_count()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
  as $body$
  begin
    if tg_op = 'INSERT' then
      update public.testimonies
      set encouragement_count = encouragement_count + 1
      where id = new.testimony_id;
      return new;
    end if;

    update public.testimonies
    set encouragement_count = greatest(encouragement_count - 1, 0)
    where id = old.testimony_id;
    return old;
  end;
  $body$;
  $function$;

  revoke all on function public.update_testimony_encouragement_count()
    from public, anon, authenticated;

  drop trigger if exists update_testimony_encouragement_count_after_insert
    on public.testimony_encouragements;
  create trigger update_testimony_encouragement_count_after_insert
  after insert on public.testimony_encouragements
  for each row execute function public.update_testimony_encouragement_count();

  drop trigger if exists update_testimony_encouragement_count_after_delete
    on public.testimony_encouragements;
  create trigger update_testimony_encouragement_count_after_delete
  after delete on public.testimony_encouragements
  for each row execute function public.update_testimony_encouragement_count();

  execute $function$
  create or replace function public.notify_praise_love()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
  as $body$
  declare
    author_id uuid;
    notify_enabled boolean;
  begin
    select user_id into author_id
    from public.praise_reports
    where id = new.praise_report_id;

    if author_id is not null and author_id is distinct from new.user_id then
      select praise_reaction_notifications into notify_enabled
      from public.user_settings
      where user_id = author_id;

      if coalesce(notify_enabled, true) then
        insert into public.notifications (
          user_id, type, title, body, link,
          reaction_actor_user_id, reaction_source_id
        ) values (
          author_id,
          'praise_loved',
          'Someone celebrated your praise',
          'Someone in the community shared a Love for your praise report.',
          '/praise',
          new.user_id,
          new.praise_report_id
        ) on conflict do nothing;
      end if;
    end if;
    return new;
  end;
  $body$;
  $function$;

  execute $function$
  create or replace function public.notify_testimony_encouragement()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
  as $body$
  declare
    author_id uuid;
    notify_enabled boolean;
  begin
    select user_id into author_id
    from public.testimonies
    where id = new.testimony_id;

    if author_id is not null and author_id is distinct from new.user_id then
      select testimony_reaction_notifications into notify_enabled
      from public.user_settings
      where user_id = author_id;

      if coalesce(notify_enabled, true) then
        insert into public.notifications (
          user_id, type, title, body, link,
          reaction_actor_user_id, reaction_source_id
        ) values (
          author_id,
          'testimony_encouraged',
          'Your testimony encouraged someone',
          'Someone in the community was encouraged by your testimony.',
          '/testimonies',
          new.user_id,
          new.testimony_id
        ) on conflict do nothing;
      end if;
    end if;
    return new;
  end;
  $body$;
  $function$;

  revoke all on function public.notify_praise_love()
    from public, anon, authenticated;
  revoke all on function public.notify_testimony_encouragement()
    from public, anon, authenticated;

  drop trigger if exists on_praise_love_created_notify on public.praise_loves;
  create trigger on_praise_love_created_notify
  after insert on public.praise_loves
  for each row execute function public.notify_praise_love();

  drop trigger if exists on_testimony_encouragement_created_notify
    on public.testimony_encouragements;
  create trigger on_testimony_encouragement_created_notify
  after insert on public.testimony_encouragements
  for each row execute function public.notify_testimony_encouragement();

  -- Reconcile safely if the migration is replayed after reactions exist.
  update public.testimonies testimonies
  set encouragement_count = counts.encouragement_count
  from (
    select testimony_id, count(*)::integer as encouragement_count
    from public.testimony_encouragements
    group by testimony_id
  ) counts
  where testimonies.id = counts.testimony_id;

  update public.testimonies testimonies
  set encouragement_count = 0
  where encouragement_count <> 0
    and not exists (
      select 1 from public.testimony_encouragements encouragements
      where encouragements.testimony_id = testimonies.id
    );

  create or replace view community_feed_private.prayer_wall_data
  with (security_barrier = true)
  as
  select
    id,
    created_at,
    category_id,
    request_text,
    prayer_count,
    status,
    case when is_anonymous then null::text else name end as display_name,
    coalesce(user_id = (select auth.uid()), false) as is_own
  from public.prayer_requests
  where is_public is true
    and moderation_status = 'approved'
    and coalesce(archived, false) is false;

  create or replace view community_feed_private.praise_wall_data
  with (security_barrier = true)
  as
  select
    id,
    content_text,
    created_at,
    love_count,
    coalesce(user_id = (select auth.uid()), false) as is_own
  from public.praise_reports
  where moderation_status = 'approved';

  create or replace view community_feed_private.testimonies_data
  with (security_barrier = true)
  as
  select
    t.id,
    t.content_text as faith_story,
    t.updated_at,
    t.user_id,
    case when t.is_anonymous then null::text else p.full_name end as display_name,
    t.encouragement_count,
    coalesce(t.user_id = (select auth.uid()), false) as is_own
  from public.testimonies t
  left join public.profiles p on p.id = t.user_id
  where t.moderation_status = 'approved';

  create or replace view public.prayer_wall_public
  with (security_invoker = true, security_barrier = true)
  as
  select id, created_at, category_id, request_text, prayer_count, status, display_name, is_own
  from community_feed_private.prayer_wall_data;

  create or replace view public.praise_wall_public
  with (security_invoker = true, security_barrier = true)
  as
  select id, content_text, created_at, love_count, is_own
  from community_feed_private.praise_wall_data;

  create or replace view public.testimonies_public
  with (security_invoker = true, security_barrier = true)
  as
  select id, faith_story, updated_at, user_id, display_name, encouragement_count, is_own
  from community_feed_private.testimonies_data;
end
$migration$;
