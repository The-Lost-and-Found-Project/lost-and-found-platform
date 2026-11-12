-- Standalone local contract test for the hosted prayer-request update guard.
-- This fixture intentionally does not alter Production or migration history.
BEGIN;
CREATE SCHEMA prayer_contract;
CREATE TABLE prayer_contract.requests (
  user_id uuid, status text, archived boolean, assigned_to uuid,
  moderation_status text, care_level text, answered boolean,
  answered_update text, action_contacted_at timestamptz,
  admin_idle_notified_at timestamptz, checkin_notified_at timestamptz
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
    IF SQLERRM IS DISTINCT FROM 'You are not allowed to change that field on your prayer request.' THEN RAISE; END IF;
  END;
  BEGIN
    UPDATE prayer_contract.requests SET archived=true,status='Withdrawn';
    RAISE EXCEPTION 'FAIL: owner withdrawal was unexpectedly permitted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM IS DISTINCT FROM 'You are not allowed to change that field on your prayer request.' THEN RAISE; END IF;
  END;
END $$;
-- Additional guard cases: ordinary owners must not assign or moderate requests.
DO $$ BEGIN
  BEGIN
    UPDATE prayer_contract.requests SET assigned_to='22222222-2222-4222-8222-222222222222';
    RAISE EXCEPTION 'FAIL: owner assignment was unexpectedly permitted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM IS DISTINCT FROM 'You are not allowed to change that field on your prayer request.' THEN RAISE; END IF;
  END;
  BEGIN
    UPDATE prayer_contract.requests SET moderation_status='approved-by-member';
    RAISE EXCEPTION 'FAIL: owner moderation was unexpectedly permitted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM IS DISTINCT FROM 'You are not allowed to change that field on your prayer request.' THEN RAISE; END IF;
  END;
END $$;
-- An unrelated member does not satisfy the owner-specific trigger branch.
-- This is NOT proof of access: the fixture has no RLS, whereas Production does.
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
UPDATE prayer_contract.requests SET status='Resolved';
DO $$ BEGIN
 IF (SELECT status FROM prayer_contract.requests) IS DISTINCT FROM 'Resolved' THEN
   RAISE EXCEPTION 'Expected non-owner to bypass this trigger (RLS is separately required)';
 END IF;
END $$;
UPDATE prayer_contract.requests SET status='Open';
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
-- The care-team branch bypasses this trigger; authorization is delegated elsewhere.
SELECT set_config('prayer_contract.is_care_team','true',true);
UPDATE prayer_contract.requests SET assigned_to='33333333-3333-4333-8333-333333333333';
DO $$ BEGIN
 IF (SELECT assigned_to FROM prayer_contract.requests) IS DISTINCT FROM '33333333-3333-4333-8333-333333333333'::uuid THEN
   RAISE EXCEPTION 'Expected care-team branch to bypass this trigger';
 END IF;
END $$;
SELECT set_config('prayer_contract.is_care_team','false',true);
-- The existing guard allows fields not in its comparison list; document that explicitly.
UPDATE prayer_contract.requests SET action_contacted_at=now();
DO $$ BEGIN
 IF (SELECT action_contacted_at IS NULL FROM prayer_contract.requests) THEN
   RAISE EXCEPTION 'Expected unguarded action timestamp to change';
 END IF;
END $$;
-- Additional missing-column contract: these administrative fields are not guarded.
-- These assertions document current behavior and must be inverted by the remediation.
UPDATE prayer_contract.requests SET admin_idle_notified_at=now(), checkin_notified_at=now();
DO $verify$ BEGIN
 IF (SELECT admin_idle_notified_at IS NULL OR checkin_notified_at IS NULL FROM prayer_contract.requests) THEN
   RAISE EXCEPTION 'Expected legacy guard to permit administrative timestamp changes';
 END IF;
END $verify$;
-- The fixture does not simulate PostgreSQL RLS or actual role grants.
-- Do not treat this passing contract as a production security signoff.
ROLLBACK;
SELECT 'PASS: existing guard behavior reproduced in isolated fixture';
