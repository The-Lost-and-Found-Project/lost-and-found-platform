# L&F consolidated release — operator checklist

**Candidate:** PR #178, base `main`. **Tracking:** #174. **Staging isolation:** #179.  
**Status:** authorized to advance by project owner on 2026-11-10; do not promote a release that has not satisfied the gates below.  
**Scope:** database grants and RLS, verified donor history, giving email reliability, ministry/study authorization, atomic follower notifications and notification schema.

## Known passing evidence

- GitHub **Quality** and **Database Tests** were successful at candidate `f6d427816c59e4984a71c75e241d2afb4726f275`; verify **the exact current head** again before release.
- Local isolated Supabase: 231 of 231 pgTAP assertions over 20 SQL test files on an earlier compatible release head; database CI should be checked again after any future migration change.
- Local app: 219 of 219 tests, TypeScript, lint and Next.js build at `f6d4278`.
- Hosted notifications baseline **read-only** inspected on 2026-11-10: all 20 migration-required columns/types match, RLS enabled, 3 relevant policies, `service_role` insert/update grants present.
- New release migrations were **not yet applied** to hosted L&F Supabase at last read-only check.

## Hard pre-release gates

1. **GitHub governance.** A read-only GitHub API audit on 2026-11-10 found `main` had no classic branch protection (`404 Branch not protected`) and no repository rulesets (`[]`). Do not assume CI or approvals are enforced server-side. Establish an appropriate non-disruptive protected-main policy with required GitHub Quality and Database Tests and independent reviewer eligibility before the release. With only one listed collaborator, a one-review requirement would prevent release until a qualified second reviewer is invited. Do not silently lock out the only maintainer or bypass review.
2. **Independent code review.** GitHub collaborator metadata showed just one repository collaborator on 2026-11-10. An independent reviewer has not been established. Arrange an authorized reviewer to inspect the full diff, especially the `SECURITY DEFINER` trigger, donor verified-email lookup, giving retry uncertainty, and RLS grants; capture their approval in PR #178. The owner's broad release authorization is not a substitute for actual reviewer evidence.
3. **Isolated staging.** Vercel Preview and Production environment scopes currently overlap for Supabase, Resend, VAPID, cron and other integrations. The release preview intentionally returns 503 unless `LFP_RELEASE_PREVIEW_ISOLATED=true` **and** its Supabase URL is a valid `https://*.supabase.co` address different from the known Production host. This is a second-line code safeguard, not verification of secret/key isolation. Never enable the flag until an independent operator verifies the Preview Supabase service-role credential is from a synthetic-only project, all outbound mail/push/payment jobs are sandboxed/disabled, and no Production secrets or member data are copied.
4. **Cost-conscious acceptance.** Prefer disposable local Supabase with synthetic users to test member/admin/leader/study roles. A separately hosted staging Supabase project must be approved for its concrete cost before creation. Do not repurpose unrelated Emmaus, Rare, or Carolina Hope projects.
5. **Synthetic end-to-end cases.** Test unauthorized member, leader and admin study access; private responses and session release locking; donor history with unverified vs verified email; duplicate/pending donation thank-you behavior with mocked Resend; publish/unpublish/republish, follower isolation, forced notification failure and existing push sweep. No real donor emails, payment sync or member pushes.
6. **Backend drift preflight.** In the **hosted Production database, read-only**, confirm `public.notifications` 20-column types, RLS, policies and service grants, and verify existing production notification webhook is retained. Do not copy webhook credentials into code. Check all pending migration versions against `supabase_migrations.schema_migrations`; deployment sequence must be compatible with the current production app.
7. **Security advisor triage.** A read-only Supabase security advisor check (2026-11-10) reported pre-existing warnings: mutable function search paths (3), anonymous-executable `SECURITY DEFINER` functions (8), authenticated-executable `SECURITY DEFINER` functions (12), and leaked-password protection (1), plus 14 informational RLS/no-policy findings. These are not automatically regressions introduced by PR #178; assess applicability and record risk/ownership. References: [search path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [anonymous function execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [authenticated function execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
8. **Release sequencing.** Before merging, verify GitHub required checks, versioned migrations, production branch deployment policy, rollback controls and a maintenance plan. GitHub `main` is linked to Vercel, so merging may automatically deploy application code. Review whether migration order requires an approved two-phase release. Do not merge `#171` or sequential legacy PRs alongside consolidated `#178`.

## Deployment checklist (operator to execute only after gates)

- Record current Production commit/deployment ID, approved candidate SHA and migration list; confirm backup/recovery route and notification/email kill switches.
- Stage and verify a production-configured build without assigning public domains if your deployment workflow permits. Verify exact commit and runtime environment.
- Apply **reviewed** migrations in intended order with controlled permissions; independently validate grant/RLS preflight, the notification table, and study/donor invariants. Never run destructive table replacement or restore Production data to staging.
- Promote only the tested build. If the main-branch Git integration auto-deploys, coordinate this step **before** merging to avoid code/schema race.
- Run read-only health and synthetic/admin acceptance checks; review Vercel error logs and Supabase advisories, without sending real notifications or donor emails just to test.
- If failures occur, stop new communications, use approved deployment rollback; separately assess backward-compatible DB rollback, since application rollback does **not** reverse migrations automatically.
- Record Production deployment ID, schema versions, CI, smoke test result and incident/rollback contact in #174.

## Current blocking decisions

- Independent reviewer identity/approval.
- Isolated Preview backend/credential scope, mock mail and push, and cost approval if any additional hosted database is needed.
- Approved release sequencing after staging acceptance.

**Never set `LFP_RELEASE_PREVIEW_ISOLATED=true` based solely on a non-Production URL.** Confirm service credentials and outbound hooks independently. Never merge or deploy just because CI is green.
