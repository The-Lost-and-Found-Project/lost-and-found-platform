create table if not exists public.emmaus_verse_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  canonical_key text not null,
  reference_label text not null,
  translation text not null,
  note_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, canonical_key, translation)
);

alter table public.emmaus_verse_notes enable row level security;

grant select, insert, update, delete on public.emmaus_verse_notes to authenticated;

create policy "Users can view own Emmaus verse notes"
on public.emmaus_verse_notes for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create own Emmaus verse notes"
on public.emmaus_verse_notes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own Emmaus verse notes"
on public.emmaus_verse_notes for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own Emmaus verse notes"
on public.emmaus_verse_notes for delete
to authenticated
using (auth.uid() = user_id);
