-- L&F study journey summaries and Emmaus references.
-- Group discussion, prayer requests, and private facilitator material are intentionally excluded.

create table if not exists public.study_journey_summaries (
  id uuid primary key default gen_random_uuid(),
  bible_study_id uuid not null references public.bible_studies(id) on delete cascade,
  summary text not null,
  key_points jsonb not null default '[]'::jsonb,
  practical_application text,
  scripture_references jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','pending_review','approved','rejected')),
  generated_from text not null default 'authored_study' check (generated_from in ('authored_study','admin_authored')),
  submitted_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bible_study_id)
);

create table if not exists public.study_emmaus_references (
  id uuid primary key default gen_random_uuid(),
  journey_summary_id uuid not null references public.study_journey_summaries(id) on delete cascade,
  bible_study_id uuid not null references public.bible_studies(id) on delete cascade,
  reference_type text not null check (reference_type in ('scripture','book','topic','person')),
  reference_key text not null,
  label text,
  created_at timestamptz not null default now(),
  unique (journey_summary_id, reference_type, reference_key)
);

alter table public.study_journey_summaries enable row level security;
alter table public.study_emmaus_references enable row level security;

comment on table public.study_journey_summaries is 'Short admin-approved study reference content. Never stores group discussion, prayer requests, member comments, or facilitator observations.';
comment on table public.study_emmaus_references is 'Links approved L&F study summaries to relevant Emmaus Scripture/book/topic/person locations.';
