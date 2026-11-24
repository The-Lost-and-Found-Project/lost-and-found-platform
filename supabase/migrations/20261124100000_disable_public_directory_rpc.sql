-- Keep directory listings private while the user-facing directory is disabled.
-- The admin service role retains execution for future internal workflows.
revoke execute on function public.get_directory_entries(text, text, text, text, text, integer)
  from public, anon, authenticated;
