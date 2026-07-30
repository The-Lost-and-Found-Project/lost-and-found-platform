begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

create table public.devotion_weeks (
  id uuid primary key,
  status text not null
);

alter table public.devotion_weeks enable row level security;
create policy devotion_weeks_public_published
on public.devotion_weeks
for select
to anon, authenticated
using (status = 'published');
grant select on public.devotion_weeks to anon, authenticated;

create table public.devotion_audio (
  id uuid primary key default gen_random_uuid(),
  devotion_week_id uuid not null references public.devotion_weeks(id),
  day_number smallint not null,
  audio_url text not null,
  storage_path text not null,
  audio_duration_seconds numeric(10, 3),
  voice text,
  narration_text text not null,
  content_version text not null,
  audio_version integer not null default 1,
  generated_at timestamptz,
  generation_status text not null default 'ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (devotion_week_id, day_number)
);

alter table public.devotion_audio enable row level security;
create policy devotion_audio_public_ready
on public.devotion_audio
for select
to anon, authenticated
using (
  generation_status = 'ready'
  and exists (
    select 1
    from public.devotion_weeks weeks
    where weeks.id = devotion_audio.devotion_week_id
      and weeks.status = 'published'
  )
);

revoke all privileges on public.devotion_audio from public, anon, authenticated;
grant select on public.devotion_audio to anon, authenticated;

insert into public.devotion_weeks (id, status)
values
  ('00000000-0000-0000-0000-000000000701', 'published'),
  ('00000000-0000-0000-0000-000000000702', 'draft');

insert into public.devotion_audio (
  devotion_week_id,
  day_number,
  audio_url,
  storage_path,
  narration_text,
  content_version,
  generation_status
)
values
  (
    '00000000-0000-0000-0000-000000000701',
    1,
    'https://example.test/ready.mp3',
    'published/ready.mp3',
    'Narration for the published devotion.',
    'content-a',
    'ready'
  ),
  (
    '00000000-0000-0000-0000-000000000701',
    2,
    'https://example.test/pending.mp3',
    'published/pending.mp3',
    'Narration that is not ready.',
    'content-b',
    'pending'
  ),
  (
    '00000000-0000-0000-0000-000000000702',
    1,
    'https://example.test/draft.mp3',
    'draft/ready.mp3',
    'Narration for an unpublished devotion.',
    'content-c',
    'ready'
  );

select has_table('public', 'devotion_audio', 'devotion audio metadata exists');
select has_column('public', 'devotion_audio', 'content_version', 'content is version-bound');
select has_column('public', 'devotion_audio', 'audio_version', 'audio is versioned');
select has_column('public', 'devotion_audio', 'narration_text', 'narration is separate');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.devotion_audio'::regclass),
  'devotion audio has RLS enabled'
);
select policies_are(
  'public',
  'devotion_audio',
  array['devotion_audio_public_ready'],
  'only the public-ready policy exists'
);
select table_privs_are(
  'public',
  'devotion_audio',
  'anon',
  array['SELECT'],
  'anonymous visitors can only read eligible audio metadata'
);
select table_privs_are(
  'public',
  'devotion_audio',
  'authenticated',
  array['SELECT'],
  'signed-in users cannot write audio metadata directly'
);

set local role anon;
select results_eq(
  $$select day_number::integer from public.devotion_audio order by day_number$$,
  $$values (1)$$,
  'anonymous visitors see only ready audio for a published devotion'
);
select throws_ok(
  $$insert into public.devotion_audio (
      devotion_week_id, day_number, audio_url, storage_path,
      narration_text, content_version
    ) values (
      '00000000-0000-0000-0000-000000000701', 3,
      'https://example.test/no.mp3', 'no.mp3', 'No direct writes.', 'content-d'
    )$$,
  '42501',
  null,
  'anonymous visitors cannot create devotion audio'
);

select * from finish();

rollback;
