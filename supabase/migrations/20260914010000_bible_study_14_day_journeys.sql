-- L&F Bible Study Standard: live gathering -> 14-day app discipleship journey.
-- No streaks, public rankings, shame-oriented overdue state, or forced catch-up.

create table public.bible_studies (
  id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), title text not null, subtitle text,
  ministry_eligibility text[] not null default array['general']::text[], primary_scripture_refs text[] not null default '{}'::text[], supporting_scripture_refs text[] not null default '{}'::text[],
  estimated_live_minutes integer not null default 60 check (estimated_live_minutes between 55 and 65), deck_url text, leader_guide_url text,
  discussion_prompts jsonb not null default '[]'::jsonb, reflection_prompts jsonb not null default '[]'::jsonb, variants jsonb not null default '{}'::jsonb, scheduling_metadata jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','approved','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.bible_study_journey_days (
  id uuid primary key default gen_random_uuid(), study_id uuid not null references public.bible_studies(id) on delete cascade, day_number integer not null check (day_number between 1 and 14),
  release_offset_days integer not null check (release_offset_days between 1 and 14), kind text not null check (kind in ('dig_deeper','live_it','scripture_focus','reflect','real_life','prayer','sabbath_reset','go_deeper','prepare','bridge')),
  title text not null, scripture_refs text[] not null default '{}'::text[], teaching text, story text, reflection_prompt text, prayer text, challenge text,
  estimated_minutes integer not null default 3 check (estimated_minutes between 1 and 10), sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(study_id,day_number), unique(study_id,release_offset_days)
);
create table public.bible_study_sessions (
  id uuid primary key default gen_random_uuid(), study_id uuid not null references public.bible_studies(id) on delete restrict, facilitator_id uuid not null references auth.users(id) on delete restrict,
  ministry_key text not null default 'general', status text not null default 'scheduled' check (status in ('scheduled','live','follow_up','paused','completed','ended')),
  live_started_at timestamptz, live_ended_at timestamptz, journey_started_at timestamptz, journey_paused_at timestamptz,
  total_paused_seconds bigint not null default 0 check(total_paused_seconds >= 0), completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(journey_started_at is null or live_ended_at is not null)
);
create table public.bible_study_session_members (session_id uuid not null references public.bible_study_sessions(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, joined_at timestamptz not null default now(), primary key(session_id,user_id));
create table public.bible_study_day_completions (session_id uuid not null references public.bible_study_sessions(id) on delete cascade, journey_day_id uuid not null references public.bible_study_journey_days(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, completed_at timestamptz not null default now(), primary key(session_id,journey_day_id,user_id));
create index bible_study_sessions_facilitator_idx on public.bible_study_sessions(facilitator_id,status); create index bible_study_session_members_user_idx on public.bible_study_session_members(user_id,session_id); create index bible_study_day_completions_user_idx on public.bible_study_day_completions(user_id,session_id);

create function public.set_bible_study_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;
create trigger bible_studies_set_updated_at before update on public.bible_studies for each row execute function public.set_bible_study_updated_at();
create trigger bible_study_journey_days_set_updated_at before update on public.bible_study_journey_days for each row execute function public.set_bible_study_updated_at();
create trigger bible_study_sessions_set_updated_at before update on public.bible_study_sessions for each row execute function public.set_bible_study_updated_at();

create function public.bible_study_release_time(p_started timestamptz,p_paused_seconds bigint,p_current_pause timestamptz,p_offset integer) returns timestamptz language sql stable set search_path='' as $$
 select p_started + make_interval(secs=>p_paused_seconds + case when p_current_pause is not null then extract(epoch from (now()-p_current_pause))::bigint else 0 end, days=>p_offset-1);
$$;
create function public.start_bible_study_journey(p_session_id uuid) returns public.bible_study_sessions language plpgsql security definer set search_path='' as $$ declare v public.bible_study_sessions; begin
 select * into v from public.bible_study_sessions where id=p_session_id for update; if v.id is null then raise exception 'Session not found'; end if; if v.facilitator_id<>auth.uid() then raise exception 'Only the facilitator may start this journey'; end if; if v.live_ended_at is null then raise exception 'End the live session before starting follow-up'; end if;
 update public.bible_study_sessions set status='follow_up',journey_started_at=coalesce(journey_started_at,now()),journey_paused_at=null where id=p_session_id returning * into v; return v; end; $$;
create function public.set_bible_study_journey_state(p_session_id uuid,p_action text) returns public.bible_study_sessions language plpgsql security definer set search_path='' as $$ declare v public.bible_study_sessions; begin
 select * into v from public.bible_study_sessions where id=p_session_id for update; if v.id is null then raise exception 'Session not found'; end if; if v.facilitator_id<>auth.uid() then raise exception 'Only the facilitator may change this journey'; end if;
 if p_action='pause' then if v.status<>'follow_up' then raise exception 'Only an active follow-up may be paused'; end if; update public.bible_study_sessions set status='paused',journey_paused_at=now() where id=p_session_id returning * into v;
 elsif p_action='resume' then if v.status<>'paused' or v.journey_paused_at is null then raise exception 'Journey is not paused'; end if; update public.bible_study_sessions set status='follow_up',total_paused_seconds=total_paused_seconds+greatest(0,extract(epoch from(now()-journey_paused_at))::bigint),journey_paused_at=null where id=p_session_id returning * into v;
 elsif p_action='end' then update public.bible_study_sessions set status='ended',completed_at=now() where id=p_session_id returning * into v; else raise exception 'Unsupported journey action'; end if; return v; end; $$;

create view public.bible_study_member_day_feed with(security_invoker=true) as
select sm.user_id,s.id session_id,s.study_id,s.status session_status,d.id journey_day_id,d.day_number,d.kind,d.title,d.scripture_refs,d.teaching,d.story,d.reflection_prompt,d.prayer,d.challenge,d.estimated_minutes,
 public.bible_study_release_time(s.journey_started_at,s.total_paused_seconds,s.journey_paused_at,d.release_offset_days) releases_at,c.completed_at
from public.bible_study_session_members sm join public.bible_study_sessions s on s.id=sm.session_id join public.bible_study_journey_days d on d.study_id=s.study_id left join public.bible_study_day_completions c on c.session_id=s.id and c.journey_day_id=d.id and c.user_id=sm.user_id
where s.journey_started_at is not null and s.status in('follow_up','paused','completed','ended');

alter table public.bible_studies enable row level security; alter table public.bible_study_journey_days enable row level security; alter table public.bible_study_sessions enable row level security; alter table public.bible_study_session_members enable row level security; alter table public.bible_study_day_completions enable row level security;
revoke all on table public.bible_studies,public.bible_study_journey_days,public.bible_study_sessions,public.bible_study_session_members,public.bible_study_day_completions from public,anon,authenticated;
grant select on public.bible_studies,public.bible_study_journey_days,public.bible_study_sessions,public.bible_study_session_members,public.bible_study_day_completions to authenticated; grant insert,update on public.bible_study_day_completions to authenticated; grant select on public.bible_study_member_day_feed to authenticated;
grant select,insert,update,delete on public.bible_studies,public.bible_study_journey_days,public.bible_study_sessions,public.bible_study_session_members,public.bible_study_day_completions to service_role; grant execute on function public.start_bible_study_journey(uuid),public.set_bible_study_journey_state(uuid,text) to authenticated;
create policy "Members read approved Bible studies" on public.bible_studies for select to authenticated using(status='approved');
create policy "Members read approved journey content" on public.bible_study_journey_days for select to authenticated using(exists(select 1 from public.bible_studies b where b.id=study_id and b.status='approved'));
create policy "Facilitators and members read sessions" on public.bible_study_sessions for select to authenticated using(facilitator_id=auth.uid() or exists(select 1 from public.bible_study_session_members sm where sm.session_id=id and sm.user_id=auth.uid()));
create policy "Members read their session membership" on public.bible_study_session_members for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.bible_study_sessions s where s.id=session_id and s.facilitator_id=auth.uid()));
create policy "Members read their completions" on public.bible_study_day_completions for select to authenticated using(user_id=auth.uid());
create policy "Members complete released days" on public.bible_study_day_completions for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.bible_study_session_members sm where sm.session_id=bible_study_day_completions.session_id and sm.user_id=auth.uid()) and exists(select 1 from public.bible_study_sessions s join public.bible_study_journey_days d on d.id=bible_study_day_completions.journey_day_id where s.id=bible_study_day_completions.session_id and d.study_id=s.study_id and s.journey_started_at is not null and now()>=public.bible_study_release_time(s.journey_started_at,s.total_paused_seconds,s.journey_paused_at,d.release_offset_days)));
create policy "Members may change their completion" on public.bible_study_day_completions for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on function public.set_bible_study_updated_at() from public; comment on view public.bible_study_member_day_feed is 'Member-facing 14-day follow-up feed. Today is emphasized; completed content leaves Active; no catch-up or streak mechanics.';
