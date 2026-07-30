-- Study Companion has its own access roles so the existing ministry roles in
-- public.profiles remain unchanged.
create table public.companion_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'beta', 'public')),
  is_active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index companion_memberships_one_active_owner_idx
  on public.companion_memberships (role)
  where role = 'owner' and is_active;

create index companion_memberships_granted_by_idx
  on public.companion_memberships (granted_by);

create table public.companion_features (
  feature_key text primary key check (feature_key ~ '^[a-z][a-z0-9_]*$'),
  title text not null,
  description text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companion_role_features (
  role text not null check (role in ('owner', 'admin', 'beta', 'public')),
  feature_key text not null
    references public.companion_features(feature_key) on delete cascade,
  allowed boolean not null default false,
  default_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (role, feature_key),
  check (not default_enabled or allowed)
);

create index companion_role_features_feature_key_idx
  on public.companion_role_features (feature_key);

create table public.companion_user_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_key text not null
    references public.companion_features(feature_key) on delete cascade,
  enabled boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, feature_key)
);

create index companion_user_preferences_feature_key_idx
  on public.companion_user_preferences (feature_key);

create function public.set_companion_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companion_memberships_set_updated_at
before update on public.companion_memberships
for each row execute function public.set_companion_updated_at();

create trigger companion_features_set_updated_at
before update on public.companion_features
for each row execute function public.set_companion_updated_at();

create trigger companion_role_features_set_updated_at
before update on public.companion_role_features
for each row execute function public.set_companion_updated_at();

create trigger companion_user_preferences_set_updated_at
before update on public.companion_user_preferences
for each row execute function public.set_companion_updated_at();

revoke all on function public.set_companion_updated_at() from public;

alter table public.companion_memberships enable row level security;
alter table public.companion_features enable row level security;
alter table public.companion_role_features enable row level security;
alter table public.companion_user_preferences enable row level security;

revoke all on table
  public.companion_memberships,
  public.companion_features,
  public.companion_role_features,
  public.companion_user_preferences
from public, anon, authenticated;

grant select on table
  public.companion_memberships,
  public.companion_features,
  public.companion_role_features
to authenticated;

grant select, insert, update, delete
on table public.companion_user_preferences
to authenticated;

grant select, insert, update, delete on table
  public.companion_memberships,
  public.companion_features,
  public.companion_role_features,
  public.companion_user_preferences
to service_role;

create policy "Members can read their own Companion access"
on public.companion_memberships
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Members can read active Companion features"
on public.companion_features
for select
to authenticated
using (is_active);

create policy "Members can read Companion role limits"
on public.companion_role_features
for select
to authenticated
using (true);

create policy "Members can read their own Companion preferences"
on public.companion_user_preferences
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Members can add allowed Companion preferences"
on public.companion_user_preferences
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.companion_features as feature
    join public.companion_role_features as entitlement
      on entitlement.feature_key = feature.feature_key
    where feature.feature_key = companion_user_preferences.feature_key
      and feature.is_active
      and entitlement.allowed
      and entitlement.role = coalesce(
        (
          select membership.role
          from public.companion_memberships as membership
          where membership.user_id = (select auth.uid())
            and membership.is_active
        ),
        'public'
      )
  )
);

create policy "Members can update allowed Companion preferences"
on public.companion_user_preferences
for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.companion_features as feature
    join public.companion_role_features as entitlement
      on entitlement.feature_key = feature.feature_key
    where feature.feature_key = companion_user_preferences.feature_key
      and feature.is_active
      and entitlement.allowed
      and entitlement.role = coalesce(
        (
          select membership.role
          from public.companion_memberships as membership
          where membership.user_id = (select auth.uid())
            and membership.is_active
        ),
        'public'
      )
  )
);

create policy "Members can delete their own Companion preferences"
on public.companion_user_preferences
for delete
to authenticated
using (user_id = (select auth.uid()));

insert into public.companion_features
  (feature_key, title, description, sort_order)
values
  (
    'chat',
    'Study Chat',
    'A text conversation workspace for guided Bible study.',
    10
  ),
  (
    'guided_study',
    'Guided Study',
    'Move through a Scripture-centered study one step at a time.',
    20
  ),
  (
    'scripture_explorer',
    'Scripture Explorer',
    'Collect passages and examine their context and connections.',
    30
  ),
  (
    'reflection_journal',
    'Reflection Journal',
    'Capture observations, questions, and personal responses.',
    40
  ),
  (
    'prayer_prompts',
    'Prayer Prompts',
    'Turn study insights into a concrete response and prayer.',
    50
  );

insert into public.companion_role_features
  (role, feature_key, allowed, default_enabled)
select
  role_name,
  feature.feature_key,
  role_name = 'owner',
  role_name = 'owner'
from unnest(array['owner', 'admin', 'beta', 'public']) as role_name
cross join public.companion_features as feature;

comment on table public.companion_memberships is
  'Study Companion roles, intentionally separate from profiles.role.';
comment on table public.companion_role_features is
  'Administrator-controlled feature ceilings for each Companion role.';
comment on table public.companion_user_preferences is
  'Per-user feature choices constrained by Companion role entitlements.';
