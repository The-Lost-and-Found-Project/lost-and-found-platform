-- #182: Restore server-enforced Daily Path day-release checks before member
-- INSERT/UPDATE grants in consolidated release #178.
-- No table rewrite, member-data change, notification trigger, or old migration replay.
-- The existing published curriculum and session timestamps remain authoritative.
DO $preflight$
BEGIN
 IF to_regclass('public.study_sessions') IS NULL
 OR to_regclass('public.study_session_participants') IS NULL
 OR to_regclass('public.bible_studies') IS NULL
 OR to_regclass('public.study_daily_progress') IS NULL
 OR to_regclass('public.study_daily_responses') IS NULL THEN
   RAISE EXCEPTION '#182: required existing study tables missing';
 END IF;
 IF NOT EXISTS (
   SELECT 1 FROM information_schema.columns
   WHERE table_schema='public' AND table_name='study_sessions'
   AND column_name='daily_path_released_at'
 ) THEN
   RAISE EXCEPTION '#182: Daily Path release column missing';
 END IF;
END $preflight$;

-- Fail closed if unexpected permissive policies have appeared since the
-- read-only hosted inventory. Never quietly retain a parallel access path.
-- Accept the two verified shapes: legacy hosted policy names or the already
-- modern local baseline, so that disposable replay remains idempotent.
DO $policy_preflight$
DECLARE
  actual_progress text[];
  actual_responses text[];
BEGIN
  SELECT COALESCE(array_agg(policyname::text ORDER BY policyname::text), ARRAY[]::text[])
    INTO actual_progress
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'study_daily_progress';

  SELECT COALESCE(array_agg(policyname::text ORDER BY policyname::text), ARRAY[]::text[])
    INTO actual_responses
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'study_daily_responses';

  IF actual_progress NOT IN (
    ARRAY['participants manage own daily progress']::text[],
    ARRAY['participants manage own unlocked daily progress']::text[]
  ) OR actual_responses NOT IN (
    ARRAY[
      'participants insert own daily responses',
      'participants read own or revealed group responses',
      'participants update own unlocked responses'
    ]::text[],
    ARRAY[
      'participants insert own unlocked daily responses',
      'participants read unlocked own or revealed group responses',
      'participants update own unlocked responses'
    ]::text[]
  ) THEN
    RAISE EXCEPTION '#182: unexpected Daily Path RLS policy inventory (progress %, responses %); aborting before changes', actual_progress, actual_responses;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('study_daily_progress', 'study_daily_responses')
      AND (permissive <> 'PERMISSIVE' OR roles <> ARRAY['authenticated']::name[])
  ) THEN
    RAISE EXCEPTION '#182: unexpected Daily Path policy role/type; aborting before changes';
  END IF;

  -- Policy names and roles are not enough: preserve the live restriction that
  -- both the response author and facilitator belong to the administered group.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'study_daily_responses'
      AND (
        (
          policyname IN (
            'participants read unlocked own or revealed group responses',
            'participants read own or revealed group responses'
          )
          AND position('is_active_administered_study_group_member(user_id, study_session_id)' IN qual) > 0
          AND position('is_active_administered_study_group_member(( SELECT auth.uid() AS uid), study_daily_responses.study_session_id)' IN qual) > 0
        )
        OR (
          -- Exact local pre-release baseline from 20260916043500. It is
          -- intentionally upgraded by this migration to the stricter checks
          -- installed below; arbitrary expressions still fail closed.
          to_regprocedure('public.is_active_administered_study_group_member(uuid,uuid)') IS NULL
          AND policyname IN (
            'participants read own or revealed group responses',
            'participants read unlocked own or revealed group responses'
          )
          AND position('has_locked_group_response' IN qual) > 0
          AND position('facilitator_user_id' IN qual) > 0
          AND position('is_lfp_admin' IN qual) > 0
        )
      )
  ) THEN
    RAISE EXCEPTION '#182: unexpected group-response policy expression; aborting before changes';
  END IF;
END $policy_preflight$;

-- SECURITY DEFINER is necessary to inspect membership despite the caller's
-- participant-only RLS. Bind the requested identity to auth.uid() to disallow
-- RPC probes for someone else's participation or unlocked days.
CREATE OR REPLACE FUNCTION public.is_daily_path_day_unlocked(
 uid uuid, sid uuid, dnum integer
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
 SELECT COALESCE(auth.uid() = uid, false)
 AND EXISTS (
   SELECT 1 FROM public.study_sessions ss
   JOIN public.study_session_participants sp
     ON sp.study_session_id=ss.id AND sp.user_id=uid
   JOIN public.bible_studies bs ON bs.id=ss.bible_study_id
   WHERE ss.id=sid
   AND dnum BETWEEN 1 AND 31
   AND ss.daily_path_released_at IS NOT NULL
   AND now() >= ss.daily_path_released_at
   AND jsonb_typeof(bs.devotional_cards)='array'
   AND dnum <= jsonb_array_length(bs.devotional_cards)
   AND dnum <= LEAST(
     jsonb_array_length(bs.devotional_cards),
     GREATEST(1, FLOOR(EXTRACT(EPOCH FROM
       (now()-ss.daily_path_released_at))/86400)::integer + 1)
   )
 );
$function$;
REVOKE ALL ON FUNCTION public.is_daily_path_day_unlocked(uuid,uuid,integer)
 FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_daily_path_day_unlocked(uuid,uuid,integer)
 TO authenticated;

-- This prerequisite migration sorts before the later group-discussion
-- migration; install its membership helper here so the guarded policy is
-- valid both during local replay and on hosted Production.
CREATE OR REPLACE FUNCTION public.is_active_administered_study_group_member(
 uid uuid, sid uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
 SELECT EXISTS (
   SELECT 1 FROM public.study_sessions ss
   JOIN public.study_groups g ON g.id=ss.group_id AND g.status='active'
   JOIN public.study_group_members gm ON gm.group_id=g.id
     AND gm.user_id=uid AND gm.membership_status='active'
   JOIN public.study_session_participants sp ON sp.study_session_id=ss.id
     AND sp.user_id=uid
   WHERE ss.id=sid AND ss.facilitator_user_id IS NOT NULL
   AND EXISTS (
     SELECT 1 FROM public.study_group_members leader
     WHERE leader.group_id=g.id AND leader.user_id=ss.facilitator_user_id
       AND leader.group_role='facilitator' AND leader.membership_status='active'
   )
 );
$function$;
REVOKE ALL ON FUNCTION public.is_active_administered_study_group_member(uuid,uuid)
 FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_administered_study_group_member(uuid,uuid)
 TO authenticated;

-- DROP the older permissive rules. PostgreSQL ORs permissive policies; simply
-- adding stricter policies would leave a bypass for unreleased days.
DROP POLICY IF EXISTS "participants manage own daily progress"
 ON public.study_daily_progress;
DROP POLICY IF EXISTS "participants manage own unlocked daily progress"
 ON public.study_daily_progress;
DROP POLICY IF EXISTS "participants insert own daily responses"
 ON public.study_daily_responses;
DROP POLICY IF EXISTS "participants insert own unlocked daily responses"
 ON public.study_daily_responses;
DROP POLICY IF EXISTS "participants update own unlocked responses"
 ON public.study_daily_responses;
DROP POLICY IF EXISTS "participants read own or revealed group responses"
 ON public.study_daily_responses;
DROP POLICY IF EXISTS "participants read unlocked own or revealed group responses"
 ON public.study_daily_responses;

ALTER TABLE public.study_daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_daily_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants manage own unlocked daily progress"
ON public.study_daily_progress FOR ALL TO authenticated
USING (
 user_id=auth.uid()
 AND public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
)
WITH CHECK (
 user_id=auth.uid()
 AND public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
);

CREATE POLICY "participants insert own unlocked daily responses"
ON public.study_daily_responses FOR INSERT TO authenticated
WITH CHECK (
 user_id=auth.uid()
 AND public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
);

CREATE POLICY "participants update own unlocked responses"
ON public.study_daily_responses FOR UPDATE TO authenticated
USING (
 user_id=auth.uid()
 AND public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
)
WITH CHECK (
 user_id=auth.uid()
 AND public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
);

CREATE POLICY "participants read unlocked own or revealed group responses"
ON public.study_daily_responses FOR SELECT TO authenticated
USING (
 (
   user_id=auth.uid()
   AND public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
 )
 OR (
   response_type='group_response'
   AND locked_at IS NOT NULL
   AND public.is_active_administered_study_group_member(user_id,study_session_id)
   AND (
     (
       public.is_active_administered_study_group_member(
         ( SELECT auth.uid() AS uid), study_daily_responses.study_session_id
       )
       AND public.is_daily_path_day_unlocked(auth.uid(),study_session_id,day_number)
       AND public.has_locked_group_response(auth.uid(),study_session_id,day_number)
     )
     OR EXISTS (
       SELECT 1 FROM public.study_sessions ss
       WHERE ss.id=study_daily_responses.study_session_id
       AND ss.facilitator_user_id=( SELECT auth.uid() AS uid)
       AND public.is_active_administered_study_group_member(
         ( SELECT auth.uid() AS uid), study_daily_responses.study_session_id
       )
     )
     OR public.is_lfp_admin(auth.uid())
   )
 )
);
