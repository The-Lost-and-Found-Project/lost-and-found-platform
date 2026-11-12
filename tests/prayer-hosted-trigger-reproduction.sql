-- Local-only reproduction using the exact Production guard comparison list.
-- The real hosted table is absent locally; do NOT mistake this for full integration.
BEGIN;
CREATE SCHEMA prayer_hosted_repro;
CREATE TABLE prayer_hosted_repro.requests (
  id uuid PRIMARY KEY, user_id uuid, status text, archived boolean, assigned_to uuid,
  moderation_status text, flagged boolean, flag_reason text, prayer_count integer,
  last_prayed_at timestamptz, care_level text, praise_report text,
  follow_up_needed boolean, follow_up_date date,
  last_checkin_notified_at timestamptz, last_followup_reminder_at timestamptz,
  answered boolean, answered_update text, is_public boolean,
  action_contacted_at timestamptz
);
CREATE FUNCTION prayer_hosted_repro.is_care_team() RETURNS boolean
LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('prayer_hosted_repro.care_team',true) = 'true',false) $$;
-- Keep this comparison list aligned with pg_get_functiondef() from Production.
CREATE FUNCTION prayer_hosted_repro.guard() RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'prayer_hosted_repro' AS $$
BEGIN
 IF auth.uid() = OLD.user_id AND NOT prayer_hosted_repro.is_care_team() THEN
  IF NEW.status IS DISTINCT FROM OLD.status
    OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to
    OR NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
    OR NEW.flagged IS DISTINCT FROM OLD.flagged
    OR NEW.flag_reason IS DISTINCT FROM OLD.flag_reason
    OR NEW.archived IS DISTINCT FROM OLD.archived
    OR NEW.prayer_count IS DISTINCT FROM OLD.prayer_count
    OR NEW.last_prayed_at IS DISTINCT FROM OLD.last_prayed_at
    OR NEW.care_level IS DISTINCT FROM OLD.care_level
    OR NEW.praise_report IS DISTINCT FROM OLD.praise_report
    OR NEW.follow_up_needed IS DISTINCT FROM OLD.follow_up_needed
    OR NEW.follow_up_date IS DISTINCT FROM OLD.follow_up_date
    OR NEW.last_checkin_notified_at IS DISTINCT FROM OLD.last_checkin_notified_at
    OR NEW.last_followup_reminder_at IS DISTINCT FROM OLD.last_followup_reminder_at
  THEN RAISE EXCEPTION 'You are not allowed to change that field on your prayer request.';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard BEFORE UPDATE ON prayer_hosted_repro.requests FOR EACH ROW EXECUTE FUNCTION prayer_hosted_repro.guard();
INSERT INTO prayer_hosted_repro.requests (id,user_id,status,archived,answered,is_public)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Submitted',false,false,true);
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
DO $$ BEGIN
 BEGIN
  UPDATE prayer_hosted_repro.requests SET status='Resolved',answered=true,is_public=false;
  RAISE EXCEPTION 'FAIL: owner resolution unexpectedly succeeded';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'You are not allowed to change that field on your prayer request.' THEN RAISE; END IF;
 END;
 BEGIN
  UPDATE prayer_hosted_repro.requests SET status='Withdrawn',archived=true,is_public=false;
  RAISE EXCEPTION 'FAIL: owner withdrawal unexpectedly succeeded';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'You are not allowed to change that field on your prayer request.' THEN RAISE; END IF;
 END;
END $$;
-- Demonstrate a gap: a member can change a care-team timestamp in the hosted comparison list.
UPDATE prayer_hosted_repro.requests SET action_contacted_at=now();
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM prayer_hosted_repro.requests WHERE action_contacted_at IS NOT NULL) THEN
  RAISE EXCEPTION 'Expected missing care timestamp protection to be reproduced';
 END IF;
END $$;
ROLLBACK;
SELECT 'PASS: hosted guard comparison list reproduced locally (not full hosted integration)';
