-- Keep sensitive L&F and Emmaus tables out of anonymous Data API access.
-- Preserve the existing authenticated and service-role access contract.
DO $migration$
BEGIN
  IF to_regclass('public.emmaus_discovery_progress') IS NOT NULL THEN
    REVOKE ALL PRIVILEGES ON TABLE public.emmaus_discovery_progress FROM anon, public;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.emmaus_discovery_progress TO authenticated;
    GRANT ALL PRIVILEGES ON TABLE public.emmaus_discovery_progress TO service_role;
  END IF;

  IF to_regclass('public.emmaus_scripture_nodes') IS NOT NULL THEN
    REVOKE ALL PRIVILEGES ON TABLE public.emmaus_scripture_nodes FROM anon, public;
    GRANT SELECT ON TABLE public.emmaus_scripture_nodes TO authenticated;
    GRANT ALL PRIVILEGES ON TABLE public.emmaus_scripture_nodes TO service_role;
  END IF;

  IF to_regclass('public.prayer_reactions') IS NOT NULL THEN
    -- Anonymous submissions are intentionally allowed by INSERT policy; only
    -- direct reads of member activity identities are removed.
    REVOKE SELECT ON TABLE public.prayer_reactions FROM anon, public;
  END IF;
END
$migration$;
