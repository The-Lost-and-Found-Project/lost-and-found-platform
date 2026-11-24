-- Keep directory discovery and user submissions disabled while preserving admin curation.
-- Some environments do not yet contain the directory schema, so guard each change.
do $$
begin
  if to_regprocedure('public.get_directory_entries(text,text,text,text,text,integer)') is not null then
    execute 'revoke execute on function public.get_directory_entries(text, text, text, text, text, integer) from public, anon, authenticated';
  end if;

  if to_regclass('public.directory_entries') is not null then
    execute 'revoke select on table public.directory_entries from anon';
    execute 'drop policy if exists public_read_approved_directory on public.directory_entries';
  end if;

  if to_regclass('public.directory_categories') is not null then
    execute 'revoke select on table public.directory_categories from anon';
    execute 'drop policy if exists public_read_directory_categories on public.directory_categories';
  end if;

  if to_regclass('public.directory_entry_categories') is not null then
    execute 'revoke select on table public.directory_entry_categories from anon';
    execute 'drop policy if exists public_read_directory_entry_categories on public.directory_entry_categories';
  end if;

  -- Admin access remains through the existing admin-only policies. Preserve
  -- member read access to their own saved rows while stopping save changes.
  if to_regclass('public.directory_saved_entries') is not null then
    execute 'drop policy if exists members_manage_own_saved_directory on public.directory_saved_entries';
    execute 'create policy members_read_own_saved_directory on public.directory_saved_entries for select to authenticated using (user_id = auth.uid())';
  end if;

  -- Preserve access to previous submissions, but stop new member submissions.
  if to_regclass('public.directory_submissions') is not null then
    execute 'drop policy if exists members_submit_directory_suggestions on public.directory_submissions';
  end if;
end
$$;
