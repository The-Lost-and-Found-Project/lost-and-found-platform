-- Keep directory discovery and user submissions disabled while preserving admin curation.
-- The admin service role retains function execution and bypasses RLS for internal workflows.
revoke execute on function public.get_directory_entries(text, text, text, text, text, integer)
  from public, anon, authenticated;

-- Block direct anonymous table reads that would bypass the disabled app routes.
revoke select on table public.directory_entries, public.directory_categories, public.directory_entry_categories
  from anon;

-- Authenticated administrators retain access through the existing admin-only ALL policies.
drop policy if exists public_read_approved_directory on public.directory_entries;
drop policy if exists public_read_directory_categories on public.directory_categories;
drop policy if exists public_read_directory_entry_categories on public.directory_entry_categories;

-- Keep a member's saved-resource rows private and readable, but prevent writes while the feature is off.
drop policy if exists members_manage_own_saved_directory on public.directory_saved_entries;
create policy members_read_own_saved_directory
  on public.directory_saved_entries for select to authenticated
  using (user_id = auth.uid());

-- Preserve read access to a member's prior submissions while stopping new submissions.
drop policy if exists members_submit_directory_suggestions on public.directory_submissions;
