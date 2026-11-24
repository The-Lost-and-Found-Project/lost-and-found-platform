-- Disposable, rollback-only integration test for the Production prayer guard migration.
-- Mirrors the hosted prayer_requests columns, owner/admin RLS policies, care-team
-- helper, and trigger ordering. Run only against an isolated Supabase database.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA IF NOT EXISTS community_security;
CREATE TABLE public.prayer_requests (
 id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), user_id uuid,
 name text NOT NULL, email text NOT NULL, phone text, preferred_contact text,
 category_id uuid, request_text text NOT NULL, is_public boolean NOT NULL DEFAULT true,
 is_anonymous boolean NOT NULL DEFAULT false, contact_requested boolean NOT NULL DEFAULT false,
 care_level text, assigned_to uuid, status text NOT NULL DEFAULT 'Submitted',
 follow_up_needed boolean NOT NULL DEFAULT false, follow_up_date date,
 answered boolean NOT NULL DEFAULT false, praise_report text, prayer_count integer NOT NULL DEFAULT 0,
 last_prayed_at timestamptz, preferred_care_gender text, flagged boolean NOT NULL DEFAULT false,
 flag_reason text, moderation_status text NOT NULL DEFAULT 'approved',
 archived boolean NOT NULL DEFAULT false CHECK (status IN ('Submitted','Reviewed','Assigned','Active Care','Follow-Up','Resolved','Closed','Needs Reassignment','Escalated','Unable to Contact','Withdrawn')), last_checkin_notified_at timestamptz,
 last_followup_reminder_at timestamptz, answered_update text,
 last_action_at timestamptz NOT NULL DEFAULT now(), action_contacted_at timestamptz,
 action_prayed_at timestamptz, action_update_sent_at timestamptz,
 admin_idle_notified_at timestamptz, checkin_notified_at timestamptz
);
CREATE TABLE public.prayer_guard_test_profiles (id uuid PRIMARY KEY, role text NOT NULL);
INSERT INTO public.prayer_guard_test_profiles VALUES
 ('11111111-1111-4111-8111-111111111111','member'),
 ('22222222-2222-4222-8222-222222222222','admin'),
 ('33333333-3333-4333-8333-333333333333','member');
CREATE OR REPLACE FUNCTION community_security.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $fn$ SELECT EXISTS (
 SELECT 1 FROM public.prayer_guard_test_profiles
 WHERE id=auth.uid() AND role='admin'
) $fn$;
CREATE OR REPLACE FUNCTION public.is_care_team()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $fn$ SELECT EXISTS (
 SELECT 1 FROM public.prayer_guard_test_profiles
 WHERE id=auth.uid() AND role IN ('prayer_team','pastor','admin')
) $fn$;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.prayer_requests FROM anon,public;
GRANT SELECT,UPDATE ON public.prayer_requests TO authenticated,service_role;
CREATE POLICY requests_select_own ON public.prayer_requests
 FOR SELECT TO public USING ((SELECT auth.uid())=user_id);
CREATE POLICY requests_update_own ON public.prayer_requests
 FOR UPDATE TO public USING ((SELECT auth.uid())=user_id)
 WITH CHECK ((SELECT auth.uid())=user_id);
CREATE POLICY requests_select_community_admin ON public.prayer_requests
 FOR SELECT TO authenticated USING ((SELECT community_security.is_admin()));
CREATE POLICY requests_update_community_admin ON public.prayer_requests
 FOR UPDATE TO authenticated USING ((SELECT community_security.is_admin()))
 WITH CHECK ((SELECT community_security.is_admin()));
CREATE OR REPLACE FUNCTION public.restrict_prayer_request_self_update()
RETURNS trigger LANGUAGE plpgsql AS $legacy$ BEGIN RETURN NEW; END $legacy$;
CREATE TRIGGER restrict_prayer_request_self_update_trigger
 BEFORE UPDATE ON public.prayer_requests
 FOR EACH ROW EXECUTE FUNCTION public.restrict_prayer_request_self_update();
\ir ../supabase/migrations/20261112090000_harden_prayer_request_member_guard.sql
-- Reapplying must retain one guard and keep it ahead of the moderation flagger.
\ir ../supabase/migrations/20261112090000_harden_prayer_request_member_guard.sql
DO $verify$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.prayer_requests'::regclass
  AND tgname='a_restrict_prayer_request_self_update_trigger') THEN
  RAISE EXCEPTION 'FAIL: migration did not rename guard trigger';
 END IF;
 IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.prayer_requests'::regclass
  AND tgname='restrict_prayer_request_self_update_trigger') THEN
  RAISE EXCEPTION 'FAIL: legacy trigger was duplicated';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.prayer_requests'::regclass
  AND tgname='a_restrict_prayer_request_self_update_trigger') THEN
  RAISE EXCEPTION 'FAIL: guard trigger ordering is not deterministic';
 END IF;
END $verify$;
CREATE OR REPLACE FUNCTION public.prayer_guard_test_flagger()
RETURNS trigger LANGUAGE plpgsql AS $flag$
BEGIN
 IF NEW.request_text LIKE '%[flag]%' THEN
  NEW.flagged := true;
  NEW.moderation_status := 'pending';
  NEW.flag_reason := 'Automated review';
 END IF;
 RETURN NEW;
END $flag$;
CREATE TRIGGER flag_prayer_request_content_trigger
 BEFORE UPDATE OF request_text ON public.prayer_requests
 FOR EACH ROW EXECUTE FUNCTION public.prayer_guard_test_flagger();
CREATE OR REPLACE FUNCTION public.prayer_guard_test_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $updated$
BEGIN NEW.updated_at := now(); RETURN NEW; END $updated$;
CREATE TRIGGER set_prayer_requests_updated_at
 BEFORE UPDATE ON public.prayer_requests
 FOR EACH ROW EXECUTE FUNCTION public.prayer_guard_test_updated_at();
INSERT INTO public.prayer_requests
(id,user_id,name,email,request_text,is_public,is_anonymous,status,answered,archived)
VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Member One','one@example.test','Please pray',true,false,'Reviewed',false,false),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','Member One','one@example.test','Withdraw this',true,false,'Reviewed',false,false),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','33333333-3333-4333-8333-333333333333','Member Two','two@example.test','Other member',true,false,'Reviewed',false,false);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
-- Ordinary member edit and trigger-maintained updated_at still work.
UPDATE public.prayer_requests SET request_text='Please pray for us' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
UPDATE public.prayer_requests SET request_text='Please pray [flag]' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
DO $test$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.prayer_requests WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  AND flagged AND moderation_status='pending' AND flag_reason='Automated review') THEN
  RAISE EXCEPTION 'FAIL: automatic moderation was blocked';
 END IF;
END $test$;
DO $test$
DECLARE changed integer; field_name text;
BEGIN
 BEGIN
  UPDATE public.prayer_requests SET action_contacted_at=now() WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  RAISE EXCEPTION 'FAIL: member modified protected care timestamp';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'You are not allowed to change that field on your prayer request.' THEN RAISE; END IF;
 END;
 BEGIN
  UPDATE public.prayer_requests SET assigned_to='22222222-2222-4222-8222-222222222222' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  RAISE EXCEPTION 'FAIL: member reassigned request';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'You are not allowed to change that field on your prayer request.' THEN RAISE; END IF;
 END;
 -- Every care/admin timestamp omitted by the old guard remains owner-protected.
 FOREACH field_name IN ARRAY ARRAY[
  'updated_at','last_action_at','action_contacted_at','action_prayed_at',
  'action_update_sent_at','admin_idle_notified_at','checkin_notified_at',
  'last_checkin_notified_at','last_followup_reminder_at'
 ] LOOP
  BEGIN
   EXECUTE format('UPDATE public.prayer_requests SET %I = clock_timestamp() + interval ''1 minute'' WHERE id = %L',
    field_name,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
   RAISE EXCEPTION 'FAIL: member modified protected timestamp %', field_name;
  EXCEPTION WHEN raise_exception THEN
   IF SQLERRM <> 'You are not allowed to change that field on your prayer request.' THEN RAISE; END IF;
  END;
 END LOOP;
 BEGIN
  UPDATE public.prayer_requests SET user_id='22222222-2222-4222-8222-222222222222' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  RAISE EXCEPTION 'FAIL: member changed ownership';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'Prayer request owner or identity cannot be changed' THEN RAISE; END IF;
 END;
 -- RLS keeps another member's row invisible; direct REST-style mutation affects zero rows.
 UPDATE public.prayer_requests SET request_text='Cross-member edit' WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 GET DIAGNOSTICS changed = ROW_COUNT;
 IF changed <> 0 THEN RAISE EXCEPTION 'FAIL: cross-member update affected a row'; END IF;
END $test$;
-- Owner transitions match the current API contract and work from actual stored status Reviewed.
UPDATE public.prayer_requests SET status='Resolved',answered=true,answered_update='Resolved by owner',is_public=false
 WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
UPDATE public.prayer_requests SET status='Withdrawn',archived=true,is_public=false
 WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
DO $test$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.prayer_requests WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' AND status='Withdrawn' AND archived) THEN
  RAISE EXCEPTION 'FAIL: member withdraw';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.prayer_requests WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' AND status='Resolved' AND answered) THEN
  RAISE EXCEPTION 'FAIL: member resolve';
 END IF;
END $test$;
DO $test$ BEGIN
 BEGIN
  UPDATE public.prayer_requests SET request_text='Reopened' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  RAISE EXCEPTION 'FAIL: terminal request edited';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'Terminal prayer requests cannot be edited' THEN RAISE; END IF;
 END;
END $test$;
-- A Community admin may still perform care/moderation updates through the admin RLS policy.
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
UPDATE public.prayer_requests SET action_contacted_at=now(),care_level='high'
 WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
RESET ROLE;
-- Anonymous direct updates remain denied at the table privilege boundary.
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claim.role','anon',true);
SET LOCAL ROLE anon;
DO $anon_test$ BEGIN
 BEGIN
  UPDATE public.prayer_requests SET request_text='Anonymous edit' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  RAISE EXCEPTION 'FAIL: anonymous update unexpectedly succeeded';
 EXCEPTION WHEN insufficient_privilege THEN
  NULL;
 END;
END $anon_test$;
RESET ROLE;
-- A real service_role database role can still perform trusted automation updates.
SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
UPDATE public.prayer_requests SET action_prayed_at=now(),last_action_at=now()
 WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
DO $service_test$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.prayer_requests WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc' AND action_prayed_at IS NOT NULL) THEN
  RAISE EXCEPTION 'FAIL: service-role maintenance update';
 END IF;
END $service_test$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: Production-shape prayer guard migration, owner RLS, admin path, service role, transition rules, trigger order, and idempotence';
