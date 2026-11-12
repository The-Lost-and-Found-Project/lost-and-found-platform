-- Proposed owner transition guard: isolated behavior test, not Production DDL.
-- Source statuses reflect the Production CHECK constraint and Submitted default.
-- Permitted source states remain a proposal until full lifecycle approval.
BEGIN;
CREATE SCHEMA prayer_transition_test;
CREATE TABLE prayer_transition_test.requests (owner_id uuid, status text, archived boolean, answered boolean, assigned_to uuid, moderation_status text, request_text text, is_public boolean);
CREATE FUNCTION prayer_transition_test.guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to OR NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
  RAISE EXCEPTION 'Protected field changed';
 END IF;
 IF (to_jsonb(NEW) - ARRAY['request_text','is_public','status','archived','answered']) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['request_text','is_public','status','archived','answered']) THEN
  RAISE EXCEPTION 'Protected field changed';
 END IF;
 IF NEW.status IS DISTINCT FROM OLD.status OR NEW.archived IS DISTINCT FROM OLD.archived OR NEW.answered IS DISTINCT FROM OLD.answered THEN
  IF NOT ((OLD.status IN ('Submitted','Reviewed','Assigned','Active Care','Follow-Up','Needs Reassignment','Escalated','Unable to Contact') AND NOT OLD.archived AND NOT OLD.answered AND NEW.status='Resolved' AND NEW.answered AND NOT NEW.archived)
    OR (OLD.status IN ('Submitted','Reviewed','Assigned','Active Care','Follow-Up','Needs Reassignment','Escalated','Unable to Contact') AND NOT OLD.archived AND NOT OLD.answered AND NEW.status='Withdrawn' AND NEW.archived AND NOT NEW.answered)) THEN
   RAISE EXCEPTION 'Invalid member transition';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard BEFORE UPDATE ON prayer_transition_test.requests FOR EACH ROW EXECUTE FUNCTION prayer_transition_test.guard();
INSERT INTO prayer_transition_test.requests (owner_id,status,archived,answered,assigned_to,moderation_status) VALUES ('11111111-1111-4111-8111-111111111111','Submitted',false,false,null,'approved');
DO $$ BEGIN
 BEGIN
  UPDATE prayer_transition_test.requests SET status='Resolved',answered=true,assigned_to='22222222-2222-4222-8222-222222222222';
  RAISE EXCEPTION 'FAIL: bundled administrative update accepted';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'Protected field changed' THEN RAISE; END IF;
 END;
 BEGIN
  UPDATE prayer_transition_test.requests SET status='Closed';
  RAISE EXCEPTION 'FAIL: arbitrary status accepted';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'Invalid member transition' THEN RAISE; END IF;
 END;
END $$;
-- Editing the request text remains possible without changing protected workflow fields.
UPDATE prayer_transition_test.requests SET request_text='Please pray for my family',is_public=false;
DO $ BEGIN
 IF NOT EXISTS (SELECT 1 FROM prayer_transition_test.requests WHERE request_text='Please pray for my family' AND is_public=false) THEN
  RAISE EXCEPTION 'Expected ordinary member edit to remain possible';
 END IF;
END $;
UPDATE prayer_transition_test.requests SET status='Resolved',answered=true;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM prayer_transition_test.requests WHERE status='Resolved' AND answered) THEN RAISE EXCEPTION 'Resolve failed'; END IF;
END $$;
TRUNCATE prayer_transition_test.requests;
INSERT INTO prayer_transition_test.requests (owner_id,status,archived,answered,assigned_to,moderation_status) VALUES ('11111111-1111-4111-8111-111111111111','Reviewed',false,false,null,'approved');
UPDATE prayer_transition_test.requests SET status='Withdrawn',archived=true;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM prayer_transition_test.requests WHERE status='Withdrawn' AND archived) THEN RAISE EXCEPTION 'Withdraw failed'; END IF;
END $$;
-- Already answered Reviewed rows exist in Production: neither transition is valid.
TRUNCATE prayer_transition_test.requests;
INSERT INTO prayer_transition_test.requests (owner_id,status,archived,answered,assigned_to,moderation_status) VALUES ('11111111-1111-4111-8111-111111111111','Reviewed',false,true,null,'approved');
DO $$ BEGIN
 BEGIN
  UPDATE prayer_transition_test.requests SET status='Resolved';
  RAISE EXCEPTION 'FAIL: answered request resolved again';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'Invalid member transition' THEN RAISE; END IF;
 END;
 BEGIN
  UPDATE prayer_transition_test.requests SET status='Withdrawn',archived=true;
  RAISE EXCEPTION 'FAIL: answered request withdrawn';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'Invalid member transition' THEN RAISE; END IF;
 END;
END $$;
-- Archived requests must never be reactivated by a member transition.
TRUNCATE prayer_transition_test.requests;
INSERT INTO prayer_transition_test.requests (owner_id,status,archived,answered,assigned_to,moderation_status) VALUES ('11111111-1111-4111-8111-111111111111','Reviewed',true,false,null,'approved');
DO $$ BEGIN
 BEGIN
  UPDATE prayer_transition_test.requests SET status='Resolved',answered=true,archived=false;
  RAISE EXCEPTION 'FAIL: archived request reactivated';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'Invalid member transition' THEN RAISE; END IF;
 END;
END $$;
ROLLBACK;
SELECT 'PASS: proposed prayer transition model';
