# Notification retry review — draft addendum

This addendum extends release candidate PR #178 with the durable push retry portion of issue #172. It is intended to be stacked into #178; it is not a standalone Production deployment plan.

## Changes

- The existing five-minute cron is the only push sender. The notification-created webhook now acknowledges queueing without sending, removing the second competing sender.
- A service-role-only database claim RPC gives one worker a ten-minute lease for a notification and persists attempt count.
- Transient failures retry through the existing cron, starting at five minutes and doubling to a maximum of eight attempts. Failed and overdue counts remain available through the existing admin health view without exposing a follower roster.
- Successful device subscription IDs are recorded. Retries skip devices already recorded as successful, so a partial multi-device failure targets only devices that still need delivery.
- The offline consolidated release bundle now contains nine reviewed migrations and still rejects unexpected files or hash changes.

## Validation performed on 2026-11-24

- Disposable isolated Supabase project: replayed all migrations, then executed all 22 pgTAP files directly against its local PostgreSQL instance; all passed.
- New retry pgTAP coverage checks service-role-only grants, overlapping claims, backoff eligibility, failed-state visibility, retained successful device IDs, expired-lease pause, and audited manual retry.
- Application tests: 291/291 passed.
- TypeScript, ESLint, and Next.js production build passed. The build used the Webpack builder because the local worktree uses shared, symlinked node_modules, which Turbopack refused to resolve outside the worktree.
- No production database, member data, push subscription, email, or notification was read or changed. The existing local L&F Supabase project was left running and untouched.

## Remaining limits and gates

Web Push has no idempotency key in this integration. If a device provider accepts a push but the subsequent database completion call fails, the lease will eventually expire and that same device can receive a duplicate on retry. Such an attempt is uncertain and must be reconciled before treating delivery as exactly-once. The local tests validate claim and retry state transitions; they do not simulate an external provider accepting a message while the database is unavailable.

Do not merge or deploy this addendum or PR #178 until the independent security review required by PR #178 (still outstanding), staging acceptance, hosted schema preflight, delivery uncertainty reconciliation, and explicit release authorization are recorded. Do not run SQL against Production as part of review.
