-- Rollback-only integration test of the deployable prayer guard migration.
-- Execute only against isolated Supabase. Everything is rolled back.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA IF NOT EXISTS community_security;
CREATE TABLE public.prayer_requests (
 id uuid PRIMARY KEY, user_id uuid NOT NULL, request_text text,
 category_id uuid, is_public boolean, is_anonymous boolean,
 status text, answered boolean, answered_update text, archived boolean,
 updated_at timestamptz, action_contacted_at timestamptz,
 flagged boolean, moderation_status text, flag_reason text
);
CREATE TABLE public.prayer_guard_test_profiles (id uuid PRIMARY KEY, role text);
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
CREATE OR REPLACE FUNCTION public.restrict_prayer_request_self_update()
RETURNS trigger LANGUAGE plpgsql AS $legacy$ BEGIN RETURN NEW; END $legacy$;
CREATE TRIGGER restrict_prayer_request_self_update_trigger
BEFORE UPDATE ON public.prayer_requests
FOR EACH ROW EXECUTE FUNCTION public.restrict_prayer_request_self_update();
\ir ../supabase/migrations/20261112090000_harden_prayer_request_member_guard.sql
DO $verify$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.prayer_requests'::regclass
  AND tgname='a_restrict_prayer_request_self_update_trigger') THEN
  RAISE EXCEPTION 'FAIL: migration did not rename guard trigger';
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
INSERT INTO public.prayer_requests
(id,user_id,request_text,is_public,is_anonymous,status,answered,archived)
VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '11111111-1111-4111-8111-111111111111',
 'Please pray',true,false,'Submitted',false,false),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 '11111111-1111-4111-8111-111111111111',
 'Withdraw this',true,false,'Submitted',false,false);
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
UPDATE public.prayer_requests SET request_text='Please pray for us' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
-- The member guard executes before the trusted flagger and must permit
-- text edits while the flagger sets moderation fields afterwards.
UPDATE public.prayer_requests SET request_text='Please pray [flag]' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
DO $test$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.prayer_requests WHERE flagged AND moderation_status='pending' AND flag_reason='Automated review') THEN
  RAISE EXCEPTION 'FAIL: automatic moderation was blocked';
 END IF;
END $test$;
DO $test$
BEGIN
 BEGIN
  UPDATE public.prayer_requests SET action_contacted_at=now() WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  RAISE EXCEPTION 'FAIL: member modified protected timestamp';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'You are not allowed to change that field on your prayer request.' THEN RAISE; END IF;
 END;
 BEGIN
  UPDATE public.prayer_requests SET user_id='22222222-2222-4222-8222-222222222222' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  RAISE EXCEPTION 'FAIL: member changed ownership';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'Prayer request owner or identity cannot be changed' THEN RAISE; END IF;
 END;
END $test$;
UPDATE public.prayer_requests SET status='Resolved',answered=true,answered_update='Thank you',is_public=false WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
UPDATE public.prayer_requests SET status='Withdrawn',archived=true,is_public=false WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
DO $test$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.prayer_requests WHERE status='Withdrawn' AND archived) THEN
  RAISE EXCEPTION 'FAIL: member withdraw';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.prayer_requests WHERE status='Resolved' AND answered) THEN
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
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claim.role','anon',true);
DO $test$ BEGIN
 BEGIN
  UPDATE public.prayer_requests SET request_text='Anonymous edit' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  RAISE EXCEPTION 'FAIL: anonymous update';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'Authentication required for prayer request updates' THEN RAISE; END IF;
 END;
END $test$;
-- A different member must not be able to update someone else's request.
-- This assertion checks the guard; a separate RLS fixture checks row access.
SELECT set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
DO $test$ BEGIN
 BEGIN
  UPDATE public.prayer_requests SET request_text='Cross-member edit' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  RAISE EXCEPTION 'FAIL: cross-member update';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'Prayer request owner or identity cannot be changed' THEN RAISE; END IF;
 END;
END $test$;
-- Service role maintenance must still be possible when a trusted JWT role
-- is present. This fixture uses postgres and emulated verified JWT claims;
-- it does not establish API gateway JWT signature verification.
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
UPDATE public.prayer_requests SET action_contacted_at=now() WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
DO $test$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.prayer_requests WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' AND action_contacted_at IS NOT NULL) THEN
  RAISE EXCEPTION 'FAIL: service-role maintenance';
 END IF;
END $test$;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
UPDATE public.prayer_requests SET action_contacted_at=now();
DO $test$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.prayer_requests WHERE action_contacted_at IS NOT NULL) THEN
  RAISE EXCEPTION 'FAIL: admin update';
 END IF;
END $test$;
-- Service-role JWT is trusted by the guard; a member JWT is not.
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claim.role','service_role',true);
UPDATE public.prayer_requests SET action_contacted_at='2026-11-12 12:00:00+00';
DO $test$ BEGIN
 IF (SELECT count(*) FROM public.prayer_requests WHERE action_contacted_at='2026-11-12 12:00:00+00') <> 2 THEN
  RAISE EXCEPTION 'FAIL: service role maintenance update';
 END IF;
END $test$;
ROLLBACK;
SELECT 'PASS: candidate guard local integration (schema subset only)';
