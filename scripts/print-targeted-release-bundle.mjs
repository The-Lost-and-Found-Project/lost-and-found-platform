// Produces a reviewed SQL bundle on stdout. It NEVER connects to any database.
// Usage: node scripts/print-targeted-release-bundle.mjs > /secure/path/lfp-release.sql
// Execute ONLY after the release runbook, hosted schema preflight, backup,
// change window, publication freeze and staging-risk decision are satisfied.
// The target DB and official migration history still require operator verification.
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expected,directory} from "./check-release-migration-scope.mjs";

const versions=expected.map(([name])=>name.slice(0,14));
const quoted=versions.map(v=>"'"+v+"'").join(",");
const chunks=[];
chunks.push(`-- L&F PR #178: exact reviewed 8-migration bundle, generated offline.
-- WARNING: NEVER run "supabase db push" against Production (#181).
-- Requires a separately reviewed operator session and confirmed target.
-- Must run with psql -X -v ON_ERROR_STOP=1 -f <bundle>.
-- SQL changes are transactional, but external webhook side effects are NOT.
-- Do not publish ministry content during the change window.
-- Supabase CLI history registration is a separate, audited operator step.
-- DO NOT mark migrations applied unless this SQL bundle COMMITs successfully.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';
SELECT pg_advisory_xact_lock(178, 20261110);
DO $lfp_preflight$
DECLARE missing integer;
BEGIN
 IF to_regclass('supabase_migrations.schema_migrations') IS NULL
    OR to_regclass('public.notifications') IS NULL
    OR to_regclass('public.ministry_content') IS NULL
    OR to_regclass('public.ministry_memberships') IS NULL THEN
    RAISE EXCEPTION 'Release preflight: required existing schema objects absent';
 END IF;
 IF EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations
            WHERE version IN (${quoted})) THEN
    RAISE EXCEPTION 'Release preflight: a November migration version is already registered';
 END IF;
 IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.notifications'::regclass
      AND tgname='notification_created_push' AND tgenabled='O'
      AND NOT tgisinternal
 ) THEN
    RAISE EXCEPTION 'Release preflight: existing production push webhook trigger differs';
 END IF;
 IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.ministry_content'::regclass
      AND tgname='ministry_publication_notifications' AND NOT tgisinternal
 ) THEN
    RAISE EXCEPTION 'Release preflight: ministry publication trigger already exists';
 END IF;
 SELECT count(*) INTO missing FROM (
  VALUES
    ('id','uuid'),('user_id','uuid'),('type','text'),('title','text'),
    ('body','text'),('link','text'),('prayer_request_id','uuid'),
    ('read_at','timestamptz'),('created_at','timestamptz'),
    ('testimony_id','uuid'),('praise_report_id','uuid'),('feedback_id','uuid'),
    ('application_id','uuid'),('push_status','text'),
    ('push_attempted_at','timestamptz'),('push_delivered_at','timestamptz'),
    ('push_error','text'),('reaction_actor_user_id','uuid'),
    ('reaction_source_id','uuid'),('campaign_id','uuid')
 ) AS needed(column_name,udt_name)
 WHERE NOT EXISTS (
   SELECT 1 FROM information_schema.columns c
   WHERE c.table_schema='public' AND c.table_name='notifications'
     AND c.column_name=needed.column_name AND c.udt_name=needed.udt_name
 );
 IF missing<>0 THEN
    RAISE EXCEPTION 'Release preflight: % notifications columns incompatible',missing;
 END IF;
 IF NOT (SELECT relrowsecurity FROM pg_class
         WHERE oid='public.notifications'::regclass) THEN
    RAISE EXCEPTION 'Release preflight: notifications RLS disabled';
 END IF;
 -- #182: Production presently lacks the Daily Path unlock helper and
 -- still has earlier permissive response/progress policies. Migration #4
 -- grants member write access; never make those grants until a separately
 -- reviewed correction is present. Checking *all* policy predicates prevents
 -- a same-name but weaker legacy policy from passing this gate.
 IF to_regprocedure('public.is_daily_path_day_unlocked(uuid,uuid,integer)') IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public'
        AND tablename='study_daily_progress'
        AND policyname='participants manage own unlocked daily progress'
        AND cmd='ALL'
        AND qual ILIKE '%is_daily_path_day_unlocked%'
        AND with_check ILIKE '%is_daily_path_day_unlocked%'
    )
    OR NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public'
        AND tablename='study_daily_responses'
        AND policyname='participants insert own unlocked daily responses'
        AND cmd='INSERT'
        AND with_check ILIKE '%is_daily_path_day_unlocked%'
    )
    OR NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public'
        AND tablename='study_daily_responses'
        AND policyname='participants update own unlocked responses'
        AND cmd='UPDATE'
        AND qual ILIKE '%is_daily_path_day_unlocked%'
        AND with_check ILIKE '%is_daily_path_day_unlocked%'
    )
    OR NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public'
        AND tablename='study_daily_responses'
        AND policyname='participants read unlocked own or revealed group responses'
        AND cmd='SELECT'
        AND qual ILIKE '%is_daily_path_day_unlocked%'
    ) THEN
   RAISE EXCEPTION 'Release preflight: Daily Path unlock policies absent or unsafe (#182)';
 END IF;
END $lfp_preflight$;
`);
for (const [name,sha] of expected) {
 chunks.push(`-- BEGIN REVIEWED MIGRATION: ${name}
-- SHA256: ${sha}
${readFileSync(join(directory,name),"utf8")}
-- END REVIEWED MIGRATION: ${name}
`);
}
chunks.push(`DO $lfp_postflight$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_trigger WHERE tgrelid='public.ministry_content'::regclass
  AND tgname='ministry_publication_notifications' AND tgenabled='O'
  AND NOT tgisinternal
 ) THEN
  RAISE EXCEPTION 'Release postflight: ministry publication trigger missing';
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_trigger WHERE tgrelid='public.notifications'::regclass
  AND tgname='notification_created_push' AND tgenabled='O'
  AND NOT tgisinternal
 ) THEN
  RAISE EXCEPTION 'Release postflight: existing webhook trigger missing';
 END IF;
 IF NOT has_column_privilege('authenticated','public.notifications','read_at','UPDATE')
    OR has_column_privilege('authenticated','public.notifications','push_status','UPDATE')
    OR has_column_privilege('authenticated','public.notifications','title','UPDATE') THEN
  RAISE EXCEPTION 'Release postflight: notification update grant wrong';
 END IF;
END $lfp_postflight$;
COMMIT;
-- STOP HERE. History is NOT automatically repaired.
-- After verifying successful COMMIT, separately mark exactly the 8 versions
-- applied with the official Supabase CLI migration repair --status applied,
-- on the verified target; never repair any old mismatched history versions.
`);
process.stdout.write(chunks.join("\n"));
