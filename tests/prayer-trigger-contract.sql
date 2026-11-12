-- Standalone local contract test for the hosted prayer-request update guard.
-- This fixture intentionally does not alter Production or migration history.
BEGIN;
CREATE SCHEMA prayer_contract;
CREATE TABLE prayer_contract.requests (
  user_id uuid, status text, archived boolean, assigned_to uuid,
  moderation_status text, care_level text, answered boolean,
  answered_update text, action_contacted_at timestamptz
);
CREATE FUNCTION prayer_contract.guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('request.jwt.claim.sub', true)::uuid = OLD.user_id
     AND current_setting('prayer_contract.is_care_team', true) IS DISTINCT FROM 'true' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.archived IS DISTINCT FROM OLD.archived
       OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to
       OR NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
       OR NEW.care_level IS DISTINCT FROM OLD.care_level THEN
      RAISE EXCEPTION 'You are not allowed to change that field on your prayer request.';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard BEFORE UPDATE ON prayer_contract.requests
  FOR EACH ROW EXECUTE FUNCTION prayer_contract.guard();
INSERT INTO prayer_contract.requests VALUES
('11111111-1111-4111-8111-111111111111','Open',false,null,'approved',null,false,null,null);
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
DO $$ BEGIN
  BEGIN
    UPDATE prayer_contract.requests SET status='Resolved',answered=true;
    RAISE EXCEPTION 'FAIL: owner status update was unexpectedly permitted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'FAIL: owner status update was unexpectedly permitted' THEN RAISE; END IF;
  END;
  BEGIN
    UPDATE prayer_contract.requests SET archived=true,status='Withdrawn';
    RAISE EXCEPTION 'FAIL: owner withdrawal was unexpectedly permitted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'FAIL: owner withdrawal was unexpectedly permitted' THEN RAISE; END IF;
  END;
END $$;
-- The existing guard allows fields not in its comparison list; document that explicitly.
UPDATE prayer_contract.requests SET action_contacted_at=now();
DO $$ BEGIN
 IF (SELECT action_contacted_at IS NULL FROM prayer_contract.requests) THEN
   RAISE EXCEPTION 'Expected unguarded action timestamp to change';
 END IF;
END $$;
ROLLBACK;
SELECT 'PASS: existing guard behavior reproduced in isolated fixture';
