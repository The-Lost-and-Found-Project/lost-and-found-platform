-- L&F release candidate: metadata-only PostgreSQL readiness report.
-- READ ONLY: one SELECT, no DML, no DDL, no credentials, no user/donor data.
-- Operators MUST independently verify the Supabase project is L&F Production
-- (lsxaadzyonvvdbzewpql) before relying on this report. A true catalog flag
-- is NOT owner approval, staging acceptance, a backup, or a restore drill.
-- Deliberately supports v2 / v3 Supabase CLI without using migration commands.

WITH
required_notification_columns(column_name, udt_name) AS (
  VALUES
    ('id','uuid'),('user_id','uuid'),('type','text'),('title','text'),
    ('body','text'),('link','text'),('prayer_request_id','uuid'),
    ('read_at','timestamptz'),('created_at','timestamptz'),
    ('testimony_id','uuid'),('praise_report_id','uuid'),
    ('feedback_id','uuid'),('application_id','uuid'),('push_status','text'),
    ('push_attempted_at','timestamptz'),('push_delivered_at','timestamptz'),
    ('push_error','text'),('reaction_actor_user_id','uuid'),
    ('reaction_source_id','uuid'),('campaign_id','uuid')
),
required_tables(name) AS (
 VALUES ('public.bible_studies'),('public.study_sessions'),
  ('public.study_session_participants'),('public.study_daily_progress'),
  ('public.study_daily_responses'),('public.ministry_content'),
  ('public.ministry_memberships'),('public.giving_transactions'),
  ('public.notifications'),('public.profiles')
),
reviewed_release_versions(version) AS (
 VALUES
 ('20261105170653'),('20261105173628'),('20261105174247'),
 ('20261105182138'),('20261105195229'),('20261110153802'),
 ('20261110181936'),('20261110194736')
),
policy_snapshot AS (
 SELECT
  (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='study_daily_progress') AS progress_count,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='study_daily_responses') AS responses_count,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname='public'
     AND (
      (tablename='study_daily_progress'
       AND policyname='participants manage own unlocked daily progress'
       AND cmd='ALL' AND permissive='PERMISSIVE'
       AND roles=ARRAY['authenticated']::name[]
       AND qual ILIKE '%is_daily_path_day_unlocked%'
       AND with_check ILIKE '%is_daily_path_day_unlocked%')
      OR
      (tablename='study_daily_responses'
       AND policyname='participants insert own unlocked daily responses'
       AND cmd='INSERT' AND permissive='PERMISSIVE'
       AND roles=ARRAY['authenticated']::name[]
       AND with_check ILIKE '%is_daily_path_day_unlocked%')
      OR
      (tablename='study_daily_responses'
       AND policyname='participants update own unlocked responses'
       AND cmd='UPDATE' AND permissive='PERMISSIVE'
       AND roles=ARRAY['authenticated']::name[]
       AND qual ILIKE '%is_daily_path_day_unlocked%'
       AND with_check ILIKE '%is_daily_path_day_unlocked%')
      OR
      (tablename='study_daily_responses'
       AND policyname='participants read unlocked own or revealed group responses'
       AND cmd='SELECT' AND permissive='PERMISSIVE'
       AND roles=ARRAY['authenticated']::name[]
       AND qual ILIKE '%is_daily_path_day_unlocked%')
     )
    ) AS strict_policies
),
catalog_flags AS (
 SELECT
  (SELECT count(*) FROM required_tables
    WHERE to_regclass(name) IS NULL) AS missing_tables,
  (SELECT count(*) FROM required_notification_columns n
    WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema='public' AND c.table_name='notifications'
        AND c.column_name=n.column_name AND c.udt_name=n.udt_name
    )) AS missing_notification_columns,
  EXISTS(SELECT 1 FROM pg_class
    WHERE oid=to_regclass('public.notifications') AND relrowsecurity)
     AS notifications_rls_enabled,
  EXISTS (SELECT 1 FROM pg_trigger
    WHERE tgrelid=to_regclass('public.notifications')
      AND tgname='notification_created_push' AND tgenabled='O'
      AND NOT tgisinternal) AS existing_push_trigger_enabled,
  EXISTS (SELECT 1 FROM pg_trigger
    WHERE tgrelid=to_regclass('public.ministry_content')
      AND tgname='ministry_publication_notifications'
      AND NOT tgisinternal) AS new_ministry_fanout_present,
  (SELECT count(*) FROM supabase_migrations.schema_migrations m
   JOIN reviewed_release_versions r ON m.version=r.version)
   AS release_versions_registered,
  EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations
    WHERE version='20261110224156') AS correction_version_registered,
  to_regprocedure('public.is_daily_path_day_unlocked(uuid,uuid,integer)')
    IS NOT NULL AS unlock_helper_exists,
  COALESCE(has_function_privilege('anon',
    to_regprocedure('public.is_daily_path_day_unlocked(uuid,uuid,integer)'),
    'EXECUTE'),false) AS anon_can_execute_unlock_helper,
  EXISTS(SELECT 1 FROM pg_proc p
    WHERE p.oid=to_regprocedure('public.is_daily_path_day_unlocked(uuid,uuid,integer)')
      AND p.prosecdef
      AND 'search_path=' = ANY(p.proconfig)) AS unlock_helper_has_fixed_search_path,
  (SELECT progress_count=1 AND responses_count=3 AND strict_policies=4
    FROM policy_snapshot) AS correct_study_policy_inventory,
  CASE WHEN EXISTS(
    SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='notifications'
        AND column_name='read_at'
  ) THEN has_column_privilege('authenticated','public.notifications',
    'read_at','UPDATE') ELSE false END AS member_can_update_read_at,
  CASE WHEN EXISTS(
    SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='notifications'
        AND column_name='push_status'
  ) THEN has_column_privilege('authenticated','public.notifications',
    'push_status','UPDATE') ELSE false END AS member_can_update_push_status
),
readiness AS (
 SELECT *,
   missing_tables=0 AND missing_notification_columns=0
     AND notifications_rls_enabled AND existing_push_trigger_enabled
     AND NOT new_ministry_fanout_present
     AND release_versions_registered=0
     AND correction_version_registered
     AND unlock_helper_exists AND NOT anon_can_execute_unlock_helper
     AND unlock_helper_has_fixed_search_path
     AND correct_study_policy_inventory
     AS catalog_ready_for_eight_file_review
 FROM catalog_flags
)
SELECT
  'LFP_PR178_READ_ONLY_CATALOG_V1' AS report_id,
  now() AS observed_at_utc,
  -- NEVER interpret this as approval to change Production.
  false AS release_authorized,
  catalog_ready_for_eight_file_review,
  missing_tables,
  missing_notification_columns,
  notifications_rls_enabled,
  existing_push_trigger_enabled,
  new_ministry_fanout_present,
  release_versions_registered,
  correction_version_registered,
  unlock_helper_exists,
  anon_can_execute_unlock_helper,
  unlock_helper_has_fixed_search_path,
  correct_study_policy_inventory,
  member_can_update_read_at,
  member_can_update_push_status
FROM readiness;
