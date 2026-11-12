-- Candidate replacement for public.restrict_prayer_request_self_update().
-- REVIEW ONLY: not a migration and not executed on Production.
-- Requires isolated integration tests against actual prayer_requests triggers/RLS.
CREATE OR REPLACE FUNCTION public.restrict_prayer_request_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $guard$
DECLARE
  member_id uuid := (SELECT auth.uid());
  workflow_changed boolean;
  allowed_transition boolean;
BEGIN
  -- Do not equate a missing auth.uid() with service-role authorization:
  -- anonymous requests also have no member identity. Only a trusted
  -- service-role JWT or an authorized Community administrator bypasses.
  IF (SELECT auth.jwt() ->> 'role') = 'service_role'
     OR (member_id IS NOT NULL AND (SELECT community_security.is_admin())) THEN
    RETURN NEW;
  END IF;
  IF member_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required for prayer request updates';
  END IF;

  -- The table's RLS must still enforce row ownership. Never let the trigger
  -- become a substitute for USING/WITH CHECK.
  IF OLD.user_id IS DISTINCT FROM member_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Prayer request owner or identity cannot be changed';
  END IF;

  -- Updated_at is maintained by a separate BEFORE UPDATE trigger, which
  -- executes after this guard by trigger-name ordering. Never let a member
  -- supply updated_at directly; only the later maintenance trigger may set it.
  -- Only these member fields and constrained workflow transitions may change.
  IF (to_jsonb(NEW) - ARRAY[
       'request_text','category_id','is_public','is_anonymous',
       'status','answered','answered_update','archived'
     ]) IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY[
       'request_text','category_id','is_public','is_anonymous',
       'status','answered','answered_update','archived','updated_at'
     ]) THEN
    RAISE EXCEPTION 'You are not allowed to change that field on your prayer request.';
  END IF;

  workflow_changed :=
    NEW.status IS DISTINCT FROM OLD.status OR
    NEW.answered IS DISTINCT FROM OLD.answered OR
    NEW.answered_update IS DISTINCT FROM OLD.answered_update OR
    NEW.archived IS DISTINCT FROM OLD.archived;

  IF NOT workflow_changed THEN
    IF OLD.answered OR OLD.archived
       OR OLD.status IN ('Resolved','Closed','Withdrawn') THEN
      RAISE EXCEPTION 'Terminal prayer requests cannot be edited';
    END IF;
    RETURN NEW;
  END IF;

  allowed_transition :=
    OLD.status IN (
      'Submitted','Reviewed','Assigned','Active Care','Follow-Up',
      'Needs Reassignment','Escalated','Unable to Contact'
    )
    AND OLD.answered IS FALSE AND OLD.archived IS FALSE
    AND NEW.is_public IS FALSE
    AND NEW.request_text IS NOT DISTINCT FROM OLD.request_text
    AND NEW.category_id IS NOT DISTINCT FROM OLD.category_id
    AND NEW.is_anonymous IS NOT DISTINCT FROM OLD.is_anonymous
    AND (
      (NEW.status = 'Resolved' AND NEW.answered IS TRUE
       AND NEW.archived IS FALSE)
      OR
      (NEW.status = 'Withdrawn' AND NEW.archived IS TRUE
       AND NEW.answered IS FALSE
       AND NEW.answered_update IS NOT DISTINCT FROM OLD.answered_update)
    );
  IF NOT coalesce(allowed_transition, FALSE) THEN
    RAISE EXCEPTION 'Invalid member prayer request transition';
  END IF;
  RETURN NEW;
END;
$guard$;
