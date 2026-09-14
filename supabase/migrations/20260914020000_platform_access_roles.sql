-- Platform 2.0 authorization foundation.
-- Global system authority and ministry-scoped authority are intentionally separate.

create table public.platform_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_key text not null check (role_key in ('content_editor','admin','owner')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(user_id, role_key)
);

create table public.ministry_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ministry_key text not null,
  role_key text not null check (role_key in ('participant','facilitator','leader')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(user_id, ministry_key, role_key)
);

create index platform_role_assignments_user_idx on public.platform_role_assignments(user_id) where revoked_at is null;
create index ministry_role_assignments_user_idx on public.ministry_role_assignments(user_id,ministry_key) where revoked_at is null;

create function public.has_platform_role(p_roles text[])
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.platform_role_assignments r where r.user_id=auth.uid() and r.revoked_at is null and r.role_key=any(p_roles))
    or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin' and ('admin'=any(p_roles) or 'owner'=any(p_roles)));
$$;

create function public.has_ministry_role(p_ministry_key text,p_roles text[])
returns boolean language sql stable security definer set search_path='' as $$
  select public.has_platform_role(array['admin','owner']) or exists(
    select 1 from public.ministry_role_assignments r where r.user_id=auth.uid() and r.ministry_key=p_ministry_key and r.revoked_at is null and r.role_key=any(p_roles)
  );
$$;

create function public.can_facilitate_study_session(p_session_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.bible_study_sessions s where s.id=p_session_id and (s.facilitator_id=auth.uid() or public.has_ministry_role(s.ministry_key,array['facilitator','leader'])));
$$;

alter table public.platform_role_assignments enable row level security;
alter table public.ministry_role_assignments enable row level security;
revoke all on public.platform_role_assignments,public.ministry_role_assignments from public,anon,authenticated;
grant select on public.platform_role_assignments,public.ministry_role_assignments to authenticated;
grant all on public.platform_role_assignments,public.ministry_role_assignments to service_role;
grant execute on function public.has_platform_role(text[]),public.has_ministry_role(text,text[]),public.can_facilitate_study_session(uuid) to authenticated;

create policy "Users read own platform assignments" on public.platform_role_assignments for select to authenticated using(user_id=auth.uid() or public.has_platform_role(array['admin','owner']));
create policy "Users read relevant ministry assignments" on public.ministry_role_assignments for select to authenticated using(user_id=auth.uid() or public.has_platform_role(array['admin','owner']) or public.has_ministry_role(ministry_key,array['leader']));

-- Replace broad session visibility with assignment-aware visibility.
drop policy if exists "Facilitators and members read sessions" on public.bible_study_sessions;
create policy "Authorized users read study sessions" on public.bible_study_sessions for select to authenticated using(
  facilitator_id=auth.uid()
  or public.has_ministry_role(ministry_key,array['facilitator','leader'])
  or exists(select 1 from public.bible_study_session_members sm where sm.session_id=id and sm.user_id=auth.uid())
);

drop policy if exists "Members read their session membership" on public.bible_study_session_members;
create policy "Authorized users read session membership" on public.bible_study_session_members for select to authenticated using(
  user_id=auth.uid() or public.can_facilitate_study_session(session_id)
);

-- Facilitators may manage membership only for sessions they are authorized to facilitate.
grant insert,delete on public.bible_study_session_members to authenticated;
create policy "Facilitators enroll session members" on public.bible_study_session_members for insert to authenticated with check(public.can_facilitate_study_session(session_id));
create policy "Facilitators remove session members" on public.bible_study_session_members for delete to authenticated using(public.can_facilitate_study_session(session_id));

-- Lifecycle RPCs now authorize assigned facilitators/leaders, not only platform admins.
create or replace function public.start_bible_study_journey(p_session_id uuid) returns public.bible_study_sessions language plpgsql security definer set search_path='' as $$ declare v public.bible_study_sessions; begin
 select * into v from public.bible_study_sessions where id=p_session_id for update; if v.id is null then raise exception 'Session not found'; end if; if not public.can_facilitate_study_session(p_session_id) then raise exception 'Not authorized to facilitate this session'; end if; if v.live_ended_at is null then raise exception 'End the live session before starting follow-up'; end if;
 update public.bible_study_sessions set status='follow_up',journey_started_at=coalesce(journey_started_at,now()),journey_paused_at=null where id=p_session_id returning * into v; return v; end; $$;

create or replace function public.set_bible_study_journey_state(p_session_id uuid,p_action text) returns public.bible_study_sessions language plpgsql security definer set search_path='' as $$ declare v public.bible_study_sessions; begin
 select * into v from public.bible_study_sessions where id=p_session_id for update; if v.id is null then raise exception 'Session not found'; end if; if not public.can_facilitate_study_session(p_session_id) then raise exception 'Not authorized to facilitate this session'; end if;
 if p_action='pause' then if v.status<>'follow_up' then raise exception 'Only an active follow-up may be paused'; end if; update public.bible_study_sessions set status='paused',journey_paused_at=now() where id=p_session_id returning * into v;
 elsif p_action='resume' then if v.status<>'paused' or v.journey_paused_at is null then raise exception 'Journey is not paused'; end if; update public.bible_study_sessions set status='follow_up',total_paused_seconds=total_paused_seconds+greatest(0,extract(epoch from(now()-journey_paused_at))::bigint),journey_paused_at=null where id=p_session_id returning * into v;
 elsif p_action='end' then update public.bible_study_sessions set status='ended',completed_at=now() where id=p_session_id returning * into v; else raise exception 'Unsupported journey action'; end if; return v; end; $$;

comment on table public.platform_role_assignments is 'System-wide Platform 2.0 authority. Member remains the default profile state; elevated roles are explicit assignments.';
comment on table public.ministry_role_assignments is 'Scoped ministry participation/leadership. Hearth, Foundry, and future ministry authority belongs here rather than in global profile roles.';
