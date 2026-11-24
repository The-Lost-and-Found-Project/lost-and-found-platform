-- Interactive, facilitator-published content for L&F Live study sessions.
-- Browser clients use server routes for authorization; RLS remains enabled as a
-- deny-by-default boundary for direct Data API access.

create table if not exists public.study_session_live_posts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  post_type text not null check (post_type in ('announcement','question','poll','prayer','scripture','resource')),
  title text not null check (char_length(trim(title)) between 1 and 160),
  body text not null default '' check (char_length(body) <= 12000),
  scripture_reference text check (scripture_reference is null or char_length(trim(scripture_reference)) <= 240),
  choices jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint study_session_live_posts_choices_array check (jsonb_typeof(choices) = 'array')
);

create index if not exists study_session_live_posts_session_idx
  on public.study_session_live_posts(session_id, created_at desc);
create index if not exists study_session_live_posts_published_idx
  on public.study_session_live_posts(session_id, is_published, created_at desc);

create table if not exists public.study_session_live_post_responses (
  post_id uuid not null references public.study_session_live_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  choice text,
  response_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id),
  constraint study_session_live_post_responses_content check (
    (choice is not null and char_length(trim(choice)) between 1 and 240)
    or (response_text is not null and char_length(trim(response_text)) between 1 and 4000)
  )
);

create index if not exists study_session_live_post_responses_post_idx
  on public.study_session_live_post_responses(post_id, created_at);

alter table public.study_session_live_posts enable row level security;
alter table public.study_session_live_post_responses enable row level security;

comment on table public.study_session_live_posts is
  'Facilitator-published announcements, questions, polls, prayer prompts, Scripture, and resources for a live study session.';
comment on table public.study_session_live_post_responses is
  'One response per participant per interactive live-study post; accessed through server-authorized routes.';
