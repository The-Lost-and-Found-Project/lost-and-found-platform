-- Rollback-only representation of hosted Community table defaults and owner UPDATE.
-- This is a security regression fixture, not a hosted-schema integration test.
BEGIN;
CREATE SCHEMA community_moderation_contract;
CREATE TABLE community_moderation_contract.testimonies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid,
 content_text text NOT NULL, moderation_status text NOT NULL DEFAULT 'approved',
 flagged boolean NOT NULL DEFAULT false
);
CREATE TABLE community_moderation_contract.praise_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid,
 content_text text NOT NULL, moderation_status text NOT NULL DEFAULT 'approved',
 flagged boolean NOT NULL DEFAULT false
);
-- Use the existing Supabase authenticated role for realistic local RLS tests.

GRANT USAGE ON SCHEMA community_moderation_contract TO authenticated;
GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA community_moderation_contract TO authenticated;
ALTER TABLE community_moderation_contract.testimonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_moderation_contract.praise_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_update ON community_moderation_contract.testimonies FOR UPDATE TO authenticated
 USING (user_id = auth.uid());
CREATE POLICY owner_select ON community_moderation_contract.testimonies FOR SELECT TO authenticated
 USING (user_id = auth.uid());
CREATE POLICY owner_insert ON community_moderation_contract.testimonies FOR INSERT TO authenticated
 WITH CHECK (user_id = auth.uid());
CREATE POLICY owner_update ON community_moderation_contract.praise_reports FOR UPDATE TO authenticated
 USING (user_id = auth.uid());
CREATE POLICY owner_select ON community_moderation_contract.praise_reports FOR SELECT TO authenticated
 USING (user_id = auth.uid());
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
SET LOCAL ROLE authenticated;
INSERT INTO community_moderation_contract.testimonies(user_id,content_text)
 VALUES ('11111111-1111-4111-8111-111111111111','A testimony requiring moderation');
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM community_moderation_contract.testimonies WHERE moderation_status='approved') THEN
  RAISE EXCEPTION 'Expected hosted approved default reproduction';
 END IF;
END $$;
UPDATE community_moderation_contract.testimonies SET flagged=true,moderation_status='approved';
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM community_moderation_contract.testimonies WHERE flagged) THEN
  RAISE EXCEPTION 'Expected broad owner UPDATE reproduction';
 END IF;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: hosted moderation default and broad owner update reproduced in isolated model';
