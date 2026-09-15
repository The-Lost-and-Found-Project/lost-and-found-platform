-- CI repair for databases that received the ministry-content policy definitions
-- before the corresponding migration was recorded in schema_migrations.
-- Keep the historical migration immutable; remove duplicate named policies so
-- the historical migration can apply cleanly in replayed environments.

drop policy if exists "members read published ministry content" on public.ministry_content;
drop policy if exists "admins insert ministry content" on public.ministry_content;
drop policy if exists "admins update ministry content" on public.ministry_content;
drop policy if exists "admins delete ministry content" on public.ministry_content;
