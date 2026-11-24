-- Isolated two-member RLS contract. This is a policy model, NOT a copy of the
-- hosted prayer_requests table; migration drift remains tracked separately.
BEGIN;
CREATE SCHEMA prayer_rls_contract;
CREATE TABLE prayer_rls_contract.requests (
  id uuid PRIMARY KEY, user_id uuid NOT NULL, request_text text NOT NULL
);
ALTER TABLE prayer_rls_contract.requests ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA prayer_rls_contract TO authenticated;
GRANT SELECT, UPDATE ON prayer_rls_contract.requests TO authenticated;
CREATE POLICY owner_select ON prayer_rls_contract.requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY owner_update ON prayer_rls_contract.requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
INSERT INTO prayer_rls_contract.requests VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Private A'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','Private B');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM prayer_rls_contract.requests;
  IF n <> 1 THEN RAISE EXCEPTION 'Member A must see only one row, got %',n; END IF;
  IF EXISTS (SELECT 1 FROM prayer_rls_contract.requests WHERE request_text='Private B') THEN
    RAISE EXCEPTION 'Member A can see member B private request';
  END IF;
  UPDATE prayer_rls_contract.requests SET request_text='Tampered B'
    WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'Member A updated member B request'; END IF;
  BEGIN
    UPDATE prayer_rls_contract.requests SET user_id='22222222-2222-4222-8222-222222222222'
      WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    RAISE EXCEPTION 'FAIL: ownership reassignment succeeded';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL;
  WHEN raise_exception THEN
    IF SQLERRM = 'FAIL: ownership reassignment succeeded' THEN RAISE; END IF;
  END;
  UPDATE prayer_rls_contract.requests SET request_text='Edited A'
    WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'Member A cannot edit own request'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM prayer_rls_contract.requests;
  IF n <> 1 THEN RAISE EXCEPTION 'Member B must see only one row, got %',n; END IF;
  IF EXISTS (SELECT 1 FROM prayer_rls_contract.requests WHERE request_text='Edited A') THEN
    RAISE EXCEPTION 'Member B can see member A private request';
  END IF;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: isolated two-member RLS ownership contract';
