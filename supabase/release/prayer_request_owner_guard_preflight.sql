-- Read-only target preflight for
-- 20261112090000_harden_prayer_request_member_guard.sql.
-- Run only against the intended hosted L&F Supabase project before any DDL.
-- This query reads catalog metadata and migration history only; it never reads
-- prayer rows, Bible-study content, or changes schema/data.
-- A passing result is necessary but not sufficient for release: it does not
-- establish a fresh backup, recovery plan, migration-history reconciliation,
-- or approval to apply the migration.
-- The MD5 values below are body-drift sentinels only, not authentication checks.

WITH required_columns(column_name, data_type) AS (
  VALUES
    ('id','uuid'), ('user_id','uuid'), ('request_text','text'),
    ('category_id','uuid'), ('is_public','boolean'), ('is_anonymous','boolean'),
    ('status','text'), ('answered','boolean'), ('answered_update','text'),
    ('archived','boolean'), ('updated_at','timestamp with time zone'),
    ('action_contacted_at','timestamp with time zone'),
    ('action_prayed_at','timestamp with time zone'),
    ('action_update_sent_at','timestamp with time zone'),
    ('admin_idle_notified_at','timestamp with time zone'),
    ('checkin_notified_at','timestamp with time zone')
),
column_inventory AS (
  SELECT
    count(*) FILTER (
      WHERE columns.column_name IS NOT NULL
        AND columns.data_type = required_columns.data_type
    ) = 16 AS ready,
    coalesce(
      array_agg(
        format('%s expected %s, found %s',
          required_columns.column_name,
          required_columns.data_type,
          coalesce(columns.data_type, 'missing'))
        ORDER BY required_columns.column_name
      ) FILTER (
        WHERE columns.column_name IS NULL
          OR columns.data_type IS DISTINCT FROM required_columns.data_type
      ),
      ARRAY[]::text[]
    ) AS mismatched_columns
  FROM required_columns
  LEFT JOIN information_schema.columns AS columns
    ON columns.table_schema = 'public'
   AND columns.table_name = 'prayer_requests'
   AND columns.column_name = required_columns.column_name
),
trigger_inventory AS (
  SELECT
    count(*) FILTER (
      WHERE trigger.tgname = 'restrict_prayer_request_self_update_trigger'
        AND trigger.tgenabled = 'O'
    ) AS old_guard_enabled,
    count(*) FILTER (
      WHERE trigger.tgname = 'a_restrict_prayer_request_self_update_trigger'
    ) AS candidate_guard_present,
    count(*) FILTER (
      WHERE trigger.tgname = 'flag_prayer_request_content_trigger'
        AND trigger.tgenabled = 'O'
    ) AS content_flagger_enabled,
    count(*) FILTER (
      WHERE trigger.tgname = 'set_prayer_requests_updated_at'
        AND trigger.tgenabled = 'O'
    ) AS updated_at_trigger_enabled
  FROM pg_trigger AS trigger
  WHERE trigger.tgrelid = to_regclass('public.prayer_requests')
    AND NOT trigger.tgisinternal
),
helper_inventory AS (
  SELECT procedure.oid, procedure.prosecdef, procedure.proconfig,
    md5(procedure.prosrc) AS source_md5
  FROM pg_proc AS procedure
  WHERE procedure.oid = to_regprocedure('public.is_care_team()')
),
guard_function_inventory AS (
  SELECT procedure.oid, procedure.prosecdef, procedure.proconfig,
    md5(procedure.prosrc) AS source_md5
  FROM pg_proc AS procedure
  WHERE procedure.oid = to_regprocedure('public.restrict_prayer_request_self_update()')
),
policy_inventory AS (
  SELECT
    bool_or(policy.policyname = 'requests_select_own'
      AND policy.cmd = 'SELECT'
      AND policy.qual ILIKE '%auth.uid()%user_id%') AS own_select_present,
    bool_or(policy.policyname = 'requests_update_own'
      AND policy.cmd = 'UPDATE'
      AND policy.qual ILIKE '%auth.uid()%user_id%'
      AND policy.with_check ILIKE '%auth.uid()%user_id%') AS own_update_present
  FROM pg_policies AS policy
  WHERE policy.schemaname = 'public'
    AND policy.tablename = 'prayer_requests'
),
migration_inventory AS (
  SELECT
    to_regclass('supabase_migrations.schema_migrations') IS NOT NULL AS history_table_present,
    CASE
      WHEN to_regclass('supabase_migrations.schema_migrations') IS NULL THEN NULL
      ELSE NOT EXISTS (
        SELECT 1
        FROM supabase_migrations.schema_migrations
        WHERE version = '20261112090000'
      )
    END AS candidate_version_absent
),
checks AS (
  SELECT 'prayer_requests table exists' AS check_name,
    to_regclass('public.prayer_requests') IS NOT NULL AS ready,
    coalesce(to_regclass('public.prayer_requests')::text, 'missing') AS detail
  UNION ALL
  SELECT 'required hosted columns and types match', column_inventory.ready,
    CASE WHEN cardinality(column_inventory.mismatched_columns) = 0
      THEN 'all 16 required columns and types match'
      ELSE 'mismatches: ' || array_to_string(column_inventory.mismatched_columns, '; ')
    END
  FROM column_inventory
  UNION ALL
  SELECT 'RLS enabled', coalesce(class.relrowsecurity, false),
    CASE WHEN class.relrowsecurity THEN 'enabled' ELSE 'disabled or table missing' END
  FROM (SELECT 1) AS singleton
  LEFT JOIN pg_class AS class ON class.oid = to_regclass('public.prayer_requests')
  UNION ALL
  SELECT 'care-team helper exists with pinned empty search_path',
    helper_inventory.oid IS NOT NULL
      AND helper_inventory.prosecdef
      AND coalesce(helper_inventory.proconfig, ARRAY[]::text[]) @> ARRAY['search_path=""']
      AND helper_inventory.source_md5 = '9b967aeac33fb13ea2d5267e589a4bf1',
    CASE WHEN helper_inventory.oid IS NULL THEN 'missing'
      WHEN helper_inventory.prosecdef
        AND coalesce(helper_inventory.proconfig, ARRAY[]::text[]) @> ARRAY['search_path=""']
        AND helper_inventory.source_md5 = '9b967aeac33fb13ea2d5267e589a4bf1'
        THEN 'reviewed helper body; SECURITY DEFINER; search_path empty'
      ELSE 'helper body or security configuration differs'
    END
  FROM (SELECT 1) AS singleton
  LEFT JOIN helper_inventory ON true
  UNION ALL
  SELECT 'current guard function matches reviewed Production body',
    guard_function_inventory.oid IS NOT NULL
      AND guard_function_inventory.prosecdef
      AND coalesce(guard_function_inventory.proconfig, ARRAY[]::text[]) @> ARRAY['search_path=public']
      AND guard_function_inventory.source_md5 = '09dc17678efb609ef3f7b97b4292bede',
    CASE WHEN guard_function_inventory.oid IS NULL THEN 'missing'
      WHEN guard_function_inventory.prosecdef
        AND coalesce(guard_function_inventory.proconfig, ARRAY[]::text[]) @> ARRAY['search_path=public']
        AND guard_function_inventory.source_md5 = '09dc17678efb609ef3f7b97b4292bede'
        THEN 'reviewed current body; SECURITY DEFINER; search_path public'
      ELSE 'guard body or security configuration differs; stop and review'
    END
  FROM (SELECT 1) AS singleton
  LEFT JOIN guard_function_inventory ON true
  UNION ALL
  SELECT 'existing guard present once; candidate guard absent',
    trigger_inventory.old_guard_enabled = 1
      AND trigger_inventory.candidate_guard_present = 0,
    format('old enabled=%s, candidate present=%s',
      trigger_inventory.old_guard_enabled, trigger_inventory.candidate_guard_present)
  FROM trigger_inventory
  UNION ALL
  SELECT 'moderation and updated_at triggers enabled',
    trigger_inventory.content_flagger_enabled = 1
      AND trigger_inventory.updated_at_trigger_enabled = 1,
    format('content flagger enabled=%s, updated_at enabled=%s',
      trigger_inventory.content_flagger_enabled, trigger_inventory.updated_at_trigger_enabled)
  FROM trigger_inventory
  UNION ALL
  SELECT 'candidate trigger ordering places guard before flagger and updated_at',
    'a_restrict_prayer_request_self_update_trigger'
      < 'flag_prayer_request_content_trigger'
      AND 'flag_prayer_request_content_trigger' < 'set_prayer_requests_updated_at',
    'PostgreSQL alphabetical BEFORE-trigger order'
  UNION ALL
  SELECT 'owner SELECT and UPDATE policies present',
    coalesce(policy_inventory.own_select_present, false)
      AND coalesce(policy_inventory.own_update_present, false),
    format('select=%s, update_with_check=%s',
      coalesce(policy_inventory.own_select_present, false),
      coalesce(policy_inventory.own_update_present, false))
  FROM policy_inventory
  UNION ALL
  SELECT 'authenticated UPDATE grant present',
    has_table_privilege('authenticated', 'public.prayer_requests', 'UPDATE'),
    CASE WHEN has_table_privilege('authenticated', 'public.prayer_requests', 'UPDATE')
      THEN 'present' ELSE 'missing' END
  UNION ALL
  SELECT 'migration history available and candidate version absent',
    migration_inventory.history_table_present
      AND coalesce(migration_inventory.candidate_version_absent, false),
    CASE WHEN NOT migration_inventory.history_table_present THEN 'history table missing'
      WHEN migration_inventory.candidate_version_absent THEN 'candidate version absent'
      ELSE 'candidate version already recorded'
    END
  FROM migration_inventory
)
SELECT check_name, ready,
  bool_and(ready) OVER () AS all_checks_ready,
  detail
FROM checks
ORDER BY check_name;
