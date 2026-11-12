-- Controlled rollback for the prayer-request owner update guard.
-- Run only if the exact PR #219 guard migration was applied and postflight
-- requires rollback. This restores the previously reviewed Production function
-- body (MD5 09dc17678efb609ef3f7b97b4292bede) and trigger name. It changes no rows.
DO $preflight$
BEGIN
  IF to_regclass('public.prayer_requests') IS NULL THEN
    RAISE EXCEPTION 'prayer_requests missing; manual recovery required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.prayer_requests'::regclass
      AND tgname='a_restrict_prayer_request_self_update_trigger'
      AND tgenabled='O'
  ) OR EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.prayer_requests'::regclass
      AND tgname='restrict_prayer_request_self_update_trigger'
  ) THEN
    RAISE EXCEPTION 'Expected PR #219 trigger state not present; refusing rollback';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM supabase_migrations.schema_migrations
    WHERE version='20261112090000'
      AND name='harden_prayer_request_member_guard'
      AND cardinality(statements)=1
      AND md5(statements[1])='1abca3455b0745781db65fff38ff1b6d'
  ) THEN
    RAISE EXCEPTION 'Exact PR #219 migration ledger entry missing; refusing rollback';
  END IF;
END $preflight$;

CREATE OR REPLACE FUNCTION public.restrict_prayer_request_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $body$
begin
  if auth.uid() = old.user_id and not is_care_team() then
    if new.status is distinct from old.status
       or new.assigned_to is distinct from old.assigned_to
       or new.moderation_status is distinct from old.moderation_status
       or new.flagged is distinct from old.flagged
       or new.flag_reason is distinct from old.flag_reason
       or new.archived is distinct from old.archived
       or new.prayer_count is distinct from old.prayer_count
       or new.last_prayed_at is distinct from old.last_prayed_at
       or new.care_level is distinct from old.care_level
       or new.praise_report is distinct from old.praise_report
       or new.follow_up_needed is distinct from old.follow_up_needed
       or new.follow_up_date is distinct from old.follow_up_date
       or new.last_checkin_notified_at is distinct from old.last_checkin_notified_at
       or new.last_followup_reminder_at is distinct from old.last_followup_reminder_at
    then
      raise exception 'You are not allowed to change that field on your prayer request.';
    end if;
  end if;
  return new;
end;
$body$;

ALTER TRIGGER a_restrict_prayer_request_self_update_trigger
  ON public.prayer_requests
  RENAME TO restrict_prayer_request_self_update_trigger;

DELETE FROM supabase_migrations.schema_migrations
WHERE version='20261112090000'
  AND name='harden_prayer_request_member_guard'
  AND cardinality(statements)=1
  AND md5(statements[1])='1abca3455b0745781db65fff38ff1b6d';