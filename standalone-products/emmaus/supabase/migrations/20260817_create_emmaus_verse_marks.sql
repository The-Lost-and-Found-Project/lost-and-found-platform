create table if not exists public.emmaus_verse_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  canonical_key text not null,
  reference_label text not null,
  translation text not null,
  created_at timestamptz not null default now(),
  unique (user_id, canonical_key, translation)
);

create table if not exists public.emmaus_verse_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  canonical_key text not null,
  reference_label text not null,
  translation text not null,
  highlight_style text not null default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, canonical_key, translation)
);

alter table public.emmaus_verse_bookmarks enable row level security;
alter table public.emmaus_verse_highlights enable row level security;

grant select, insert, delete on public.emmaus_verse_bookmarks to authenticated;
grant select, insert, update, delete on public.emmaus_verse_highlights to authenticated;

create policy "Users can view own Emmaus bookmarks" on public.emmaus_verse_bookmarks for select to authenticated using (auth.uid() = user_id);
create policy "Users can create own Emmaus bookmarks" on public.emmaus_verse_bookmarks for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own Emmaus bookmarks" on public.emmaus_verse_bookmarks for delete to authenticated using (auth.uid() = user_id);

create policy "Users can view own Emmaus highlights" on public.emmaus_verse_highlights for select to authenticated using (auth.uid() = user_id);
create policy "Users can create own Emmaus highlights" on public.emmaus_verse_highlights for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own Emmaus highlights" on public.emmaus_verse_highlights for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own Emmaus highlights" on public.emmaus_verse_highlights for delete to authenticated using (auth.uid() = user_id);
