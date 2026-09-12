alter table public.content_catalog
  add column if not exists content_data jsonb not null default '{}'::jsonb;

comment on column public.content_catalog.content_data is
  'Structured payload for trivia questions, study sections, devotional steps, collections, and media metadata.';
