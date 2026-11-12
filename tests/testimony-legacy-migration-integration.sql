-- Rollback-only integration test of the EXISTING local hardening migration.
-- Creates minimal table fixtures because hosted community tables are absent locally.
-- NOT equivalent to full hosted schema integration; no Production changes.
BEGIN;
CREATE TABLE public.testimonies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE NOT NULL,
 content_text text NOT NULL, is_anonymous boolean NOT NULL DEFAULT false,
 moderation_status text NOT NULL DEFAULT 'approved', updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.praise_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid,
 moderation_status text NOT NULL DEFAULT 'approved'
);
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.praise_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY testimonies_insert_own ON public.testimonies FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY testimonies_update_own ON public.testimonies FOR UPDATE TO authenticated USING (auth.uid()=user_id);
CREATE POLICY testimonies_select_own ON public.testimonies FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY praise_insert_own ON public.praise_reports FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY praise_update_own ON public.praise_reports FOR UPDATE TO authenticated USING (auth.uid()=user_id);
GRANT SELECT,INSERT,UPDATE ON public.testimonies TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.praise_reports TO authenticated;
\ir ../supabase/migrations/20260930000500_harden_community_member_updates.sql
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE saved uuid; BEGIN
 saved := public.submit_own_testimony('A testimony with enough characters',false);
 IF NOT EXISTS (SELECT 1 FROM public.testimonies WHERE id=saved AND moderation_status='pending') THEN
  RAISE EXCEPTION 'Submission did not become pending'; END IF;
 PERFORM public.update_own_testimony(saved,'A revised testimony with enough characters',true);
 IF NOT EXISTS (SELECT 1 FROM public.testimonies WHERE id=saved AND moderation_status='pending' AND is_anonymous) THEN
  RAISE EXCEPTION 'Update did not remain pending'; END IF;
 UPDATE public.testimonies SET moderation_status='approved' WHERE id=saved;
 IF FOUND THEN RAISE EXCEPTION 'Owner direct UPDATE unexpectedly modified a row'; END IF;
 BEGIN
  PERFORM public.submit_own_testimony('A second testimony should fail',false);
  RAISE EXCEPTION 'Duplicate testimony unexpectedly succeeded';
 EXCEPTION WHEN unique_violation THEN NULL;
 END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: legacy testimony RPC migration works on isolated table fixture';
