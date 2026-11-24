-- Align table privileges with the existing authenticated-only RLS policies.
-- RLS already denies anonymous rows; revoking SELECT provides defense in depth.
revoke select on table public.emmaus_discovery_progress from anon;
revoke select on table public.emmaus_scripture_nodes from anon;
