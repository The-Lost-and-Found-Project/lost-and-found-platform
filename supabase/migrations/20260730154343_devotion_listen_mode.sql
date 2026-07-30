-- Add version-aware devotional audio without changing the devotion content model.
-- The guard keeps isolated local databases usable because the production
-- devotion_weeks table predates this repository's tracked migrations.
do $migration$
begin
  if to_regclass('public.devotion_weeks') is null then
    raise notice 'Skipping devotion listen migration: devotion_weeks is not present.';
    return;
  end if;

  create table if not exists public.devotion_audio (
    id uuid primary key default gen_random_uuid(),
    devotion_week_id uuid not null
      references public.devotion_weeks(id) on delete cascade,
    day_number smallint not null
      check (day_number between 1 and 31),
    audio_url text not null,
    storage_path text not null,
    audio_duration_seconds numeric(10, 3),
    voice text,
    narration_text text not null,
    content_version text not null,
    audio_version integer not null default 1
      check (audio_version > 0),
    generated_at timestamptz,
    generation_status text not null default 'ready'
      check (generation_status in ('pending', 'processing', 'ready', 'failed')),
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (devotion_week_id, day_number)
  );

  create index if not exists devotion_audio_ready_lookup_idx
    on public.devotion_audio (devotion_week_id, day_number)
    where generation_status = 'ready';

  alter table public.devotion_audio enable row level security;

  drop policy if exists devotion_audio_public_ready on public.devotion_audio;
  execute $policy$
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
    )
  $policy$;

  revoke all privileges on table public.devotion_audio
    from public, anon, authenticated;
  grant select on table public.devotion_audio to anon, authenticated;

  insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
  )
  values (
    'devotion-audio',
    'devotion-audio',
    true,
    52428800,
    array[
      'audio/mpeg',
      'audio/mp4',
      'audio/ogg',
      'audio/wav',
      'audio/x-wav',
      'audio/webm'
    ]
  )
  on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
end;
$migration$;
