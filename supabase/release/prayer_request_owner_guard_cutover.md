# PR #219 controlled cutover runbook

This is an allowlisted release for one reviewed migration. It is not a repair or replay of the repository's historical migration set.

## Target and artifacts

- Migration: `supabase/migrations/20261112090000_harden_prayer_request_member_guard.sql`
- Migration SHA-256: `435e6f9d922d94a809a27487d774651b0ba97d916cc1629b838bb95f540a14a4`
- Read-only preflight: `supabase/release/prayer_request_owner_guard_preflight.sql`
- Read-only postflight: `supabase/release/prayer_request_owner_guard_postflight.sql`
- Recovery SQL: `supabase/release/prayer_request_owner_guard_rollback.sql`
- Payload builder: `scripts/build-prayer-guard-cutover.mjs`
- Preflight checks schema, RLS, grants, trigger ordering, helper/function fingerprints, and candidate version absence. It reads no prayer or Bible study rows.

## Before the window

1. Confirm exact PR head and migration hash. Do not substitute another or historical migration.
2. Confirm the latest completed Production physical backup is available and record its timestamp. Read-only inventory on 2026-11-12 found the newest completed snapshot at 2026-11-11 08:44:47 UTC.
3. Confirm the recovery operator can access the dashboard and understands the rollback SQL. The rollback requires the exact PR #219 ledger entry and verifies its SQL body before reverting.
4. Pause ministry publishing that can create live push events for the short migration window.
5. Run the preflight against Production. Require all 11 rows to report `ready = true` and `all_checks_ready = true`. Stop on any mismatch.
6. Obtain independent release review and the Owner's merge/release approval.

## Apply exactly one change

The generic Supabase MCP `apply_migration` call generates a runtime version rather than the repository file's version. Do not use it for this release.

Generate the atomic, exact-version payload from the repository root:

```sh
node scripts/build-prayer-guard-cutover.mjs > /tmp/pr219-cutover.sql
```

Review the generated header/hash and run only that payload once through the Supabase SQL editor or the authorized SQL executor. It wraps the candidate DDL and the exact `20261112090000` history entry in one transaction, stores the exact migration and rollback SQL in the migration ledger, and rejects a missing ledger or a duplicate version. It does not replay or repair any older version. Do not run `supabase db push`, `supabase migration repair`, or another migration.

## Verify and recover

1. Run the postflight query. Require all 11 checks to pass, including the candidate function fingerprint, enabled trigger exactly once, old name absent, moderation and updated-at triggers enabled, owner RLS, and exact migration version/body recorded once.
2. Exercise ordinary member text edit, protected-field denial, allowed resolve/withdraw, cross-member denial, care-team access, and service-role maintenance with synthetic accounts only.
3. If postflight fails, stop app rollout. Run `prayer_request_owner_guard_rollback.sql` only if its state and exact ledger-body preflights pass. It restores the previous Production function body (source MD5 `09dc17678efb609ef3f7b97b4292bede`), restores the original trigger name, and removes only the exact PR #219 ledger entry it verified. It modifies no data. Rerun read-only catalog checks.
4. Record operator, UTC timestamps, exact hashes, pre/postflight results, and rollback or completion status on PR #219 and issue #203.

## Staging verification — 2026-11-12

A temporary hosted Supabase branch was created with `with_data: false`. It had no production rows. Its baseline migration provisioning failed before creating public tables, so a minimal synthetic Production-shaped prayer schema was installed only on that branch; the helper body was copied from the read-only Production catalog. The exact candidate migration was then applied with the generated exact-version ledger payload.

- Exact-version postflight: 11/11 checks passed, including the source body MD5 in the ledger and guard function fingerprint.
- Authenticated Supabase API contract: 7/7 passed for owner text edit, protected timestamp denial, cross-member privacy, care-team timestamp maintenance, resolve transition, terminal edit denial, and service-role maintenance.
- Rollback verification: the prior guard body MD5 `09dc17678efb609ef3f7b97b4292bede` and original trigger name were restored; only the exact candidate history row was removed.
- The temporary branch was deleted after verification. No Production rows or schemas were changed.

This covers the prayer guard contract on the supplied schema fixture. It does not establish a clean replay of the full repository migration history or a complete signed-in Vercel Preview journey.

## Scope

Never reconcile or rewrite older migration ledger entries as part of this release. The broad source/hosted history divergence tracked by #181 remains a separate project. Preserve Production prayer records, Bible studies, and push state.