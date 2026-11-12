-- Proposed owner transition guard: isolated behavior test, not Production DDL.
-- Source statuses reflect the Production CHECK constraint and Submitted default.
-- Permitted source states remain a proposal until full lifecycle approval.
BEGIN;
CREATE SCHEMA prayer_transition_test;
CREATE TABLE prayer_transition_test.requests (owner_id uuid, status text, archived boolean, answered boolean, assigned_to uuid, moderation_status text);
CREATE FUNCTION prayer_transition_test.guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to OR NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
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
INSERT INTO prayer_transition_test.requests VALUES ('11111111-1111-4111-8111-111111111111','Submitted',false,false,null,'approved');
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
UPDATE prayer_transition_test.requests SET status='Resolved',answered=true;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM prayer_transition_test.requests WHERE status='Resolved' AND answered) THEN RAISE EXCEPTION 'Resolve failed'; END IF;
END $$;
TRUNCATE prayer_transition_test.requests;
INSERT INTO prayer_transition_test.requests VALUES ('11111111-1111-4111-8111-111111111111','Reviewed',false,false,null,'approved');
UPDATE prayer_transition_test.requests SET status='Withdrawn',archived=true;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM prayer_transition_test.requests WHERE status='Withdrawn' AND archived) THEN RAISE EXCEPTION 'Withdraw failed'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: proposed prayer transition model';
