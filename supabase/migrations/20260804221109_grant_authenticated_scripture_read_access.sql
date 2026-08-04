-- The Bible chapter API uses the signed-in user's Supabase session.
-- Table privileges allow the request to reach the existing RLS policy,
-- which continues to restrict non-admin readers to published Scripture.
grant select on table public.emmaus_scripture_nodes to authenticated;
