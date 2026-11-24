-- Read-only postflight for the exact PR #219 controlled cutover.
-- Reads only schema/catalog and migration metadata; no prayer/study rows.
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
column_check AS (
  SELECT count(*) FILTER (
    WHERE c.column_name IS NOT NULL AND c.data_type = r.data_type
  ) = 16 AS ok
  FROM required_columns r
  LEFT JOIN information_schema.columns c
    ON c.table_schema='public' AND c.table_name='prayer_requests'
   AND c.column_name=r.column_name
),
helper AS (
  SELECT oid, prosecdef, proconfig, md5(prosrc) AS body_md5
  FROM pg_proc WHERE oid=to_regprocedure('public.is_care_team()')
),
guard AS (
  SELECT oid, prosecdef, proconfig, md5(prosrc) AS body_md5
  FROM pg_proc WHERE oid=to_regprocedure('public.restrict_prayer_request_self_update()')
),
triggers AS (
  SELECT
    count(*) FILTER (WHERE tgname='a_restrict_prayer_request_self_update_trigger' AND tgenabled='O') AS candidate_enabled,
    count(*) FILTER (WHERE tgname='restrict_prayer_request_self_update_trigger') AS old_guard,
    count(*) FILTER (WHERE tgname='flag_prayer_request_content_trigger' AND tgenabled='O') AS flagger_enabled,
    count(*) FILTER (WHERE tgname='set_prayer_requests_updated_at' AND tgenabled='O') AS updated_at_enabled
  FROM pg_trigger
  WHERE tgrelid=to_regclass('public.prayer_requests') AND NOT tgisinternal
),
policy_check AS (
  SELECT
    bool_or(policyname='requests_select_own' AND cmd='SELECT' AND qual ILIKE '%auth.uid()%user_id%') AS own_select,
    bool_or(policyname='requests_update_own' AND cmd='UPDATE' AND qual ILIKE '%auth.uid()%user_id%' AND with_check ILIKE '%auth.uid()%user_id%') AS own_update
  FROM pg_policies WHERE schemaname='public' AND tablename='prayer_requests'
),
migration_check AS (
  SELECT count(*)=1 AS exactly_once,
         bool_and(cardinality(statements)=1 AND md5(statements[1])='1abca3455b0745781db65fff38ff1b6d') AS body_matches
  FROM supabase_migrations.schema_migrations
  WHERE version='20261112090000' AND name='harden_prayer_request_member_guard'
),
checks AS (
  SELECT 'prayer_requests table exists' AS check_name,
         to_regclass('public.prayer_requests') IS NOT NULL AS ready
  UNION ALL
  SELECT '16 required columns and types match', column_check.ok FROM column_check
  UNION ALL
  SELECT 'RLS remains enabled', coalesce((SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.prayer_requests')),false)
  UNION ALL
  SELECT 'care helper fingerprint and security settings unchanged',
         helper.oid IS NOT NULL AND helper.prosecdef
         AND coalesce(helper.proconfig,ARRAY[]::text[]) @> ARRAY['search_path=""']
         AND helper.body_md5='9b967aeac33fb13ea2d5267e589a4bf1'
  FROM helper
  UNION ALL
  SELECT 'candidate guard function fingerprint and empty search_path',
         guard.oid IS NOT NULL AND guard.prosecdef
         AND coalesce(guard.proconfig,ARRAY[]::text[]) @> ARRAY['search_path=""']
         AND guard.body_md5='ce6eb7e66631af71d61ca4ee2c0d137a'
  FROM guard
  UNION ALL
  SELECT 'candidate guard enabled once; legacy name absent',
         triggers.candidate_enabled=1 AND triggers.old_guard=0
  FROM triggers
  UNION ALL
  SELECT 'moderation and updated_at triggers remain enabled',
         triggers.flagger_enabled=1 AND triggers.updated_at_enabled=1
  FROM triggers
  UNION ALL
  SELECT 'trigger order remains guard, flagger, updated_at',
         'a_restrict_prayer_request_self_update_trigger' < 'flag_prayer_request_content_trigger'
         AND 'flag_prayer_request_content_trigger' < 'set_prayer_requests_updated_at'
  UNION ALL
  SELECT 'owner select and update-with-check policies remain present',
         coalesce(policy_check.own_select,false) AND coalesce(policy_check.own_update,false)
  FROM policy_check
  UNION ALL
  SELECT 'authenticated update grant remains present',
         has_table_privilege('authenticated','public.prayer_requests','UPDATE')
  UNION ALL
  SELECT 'exact migration version recorded once with matching SQL body',
         migration_check.exactly_once AND migration_check.body_matches
  FROM migration_check
)
SELECT check_name, ready, bool_and(ready) OVER () AS all_checks_ready
FROM checks
ORDER BY check_name;