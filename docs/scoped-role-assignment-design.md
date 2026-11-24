# Scoped role assignment foundation

Status: implementation design for review. This document does not change database schema or live authorization.

## Product rules

- Signup creates a member account immediately.
- Every capability beyond baseline membership requires an explicit approval.
- A person may hold several roles at once; role assignments carry their ministry or group scope.
- Group participation has a separate lifecycle from role assignment; joining a group never grants authority. See `docs/group-membership-and-approval-flow.md`.
- An approver may act only inside the role types and scopes explicitly delegated to them.
- Non-admin role requests go only to reviewers explicitly assigned the exact role and ministry/group scope. Admins have no blanket approval authority; ministry leaders may review only when explicitly delegated that exact role/scope. Specific reviewer assignments and delegation duration remain to be configured. See `docs/role-approval-authority-matrix.md`.
- No person approves their own request or grants authority beyond their own.
- Only configured Owners can grant or remove administrator access, change integrations, or authorize paid services.
- The existing Supervisor lane remains supported during migration.
- Member privacy and confidential care access are separate from role assignment. A moderation role never widens a member-selected prayer audience.

## Current system constraints

`profiles.role` is a single account-wide value constrained to `member`, `facilitator`, `supervisor`, or `admin`. The effective-role helper and many server routes, components, and RLS policies read that field directly. The initial repository search found role-based checks in 51 application files and 13 migrations; that is a discovery count, not a complete inventory. Replacing the field in place would risk removing or widening existing access.

## Proposed additive data model

Keep `profiles.role` as a compatibility field while migrating existing consumers. Add three narrowly scoped tables:

- `role_requests`: requester, requested role, scope kind and scope ID, optional explanation, status, timestamps, and current decision.
- `role_assignments`: subject, approved role, scope kind and scope ID, granting request, grantor, effective time, and revocation metadata.
- `role_delegations`: delegator, delegate, allowed role types, allowed scope, effective interval, and revocation metadata.

Use a role key separate from the old profile enum: `study_facilitator`, `ministry_leader`, `prayer_team`, `moderator`, and `content_creator`. Preserve `supervisor` and existing global access during migration. Keep administrator access in the existing Owner-guarded path until every consumer has been moved and verified; do not make an ordinary role assignment an alternate way to grant admin.

Scope should be explicit: `global`, `ministry`, or `group`. A global assignment must have no scope ID; a scoped assignment must have exactly one valid scope reference. Ministry scope uses the ministry's stable slug or ID consistently with the existing ministry tables; group scope uses the existing group identifier. Do not infer a scope from the role label.

Request states: `pending`, `approved`, `declined`, `withdrawn`, and `cancelled`. A decision records the reviewer, time, and optional reason. Reassignment is a separate audited action, not an overwrite of the original reviewer. Uniqueness prevents duplicate active assignments for the same user, role, and scope.

## Authorization and RLS boundary

- Enable RLS on all new tables and explicitly revoke direct client writes. Requests and decisions go through authenticated server routes that validate the caller, active account, authority, role, scope, and request state before a service-role write.
- Keep service-role clients server-only. Every service-role route must repeat its authorization check; RLS bypass is not authorization.
- Allow a member to read their own requests and assignments. Allow staff to read only the work and scope their authority permits. Do not publish role requests or assignment data to anonymous visitors.
- Avoid policies that query the same protected assignment/delegation table recursively. Prefer server-side scoped reads for sensitive review queues until a non-recursive database helper has been independently reviewed.
- Add database-level constraints for valid scope combinations and request transitions. Add audit data that cannot be rewritten by ordinary reviewers.

## Migration sequence

1. Inventory every route, page, component, RPC, trigger, and RLS policy that reads the legacy role. Record whether it grants access, controls presentation, or both.
2. Add the tables and restrictive grants/RLS without changing existing behavior. Backfill the existing facilitator and supervisor facts into assignments only where the source is authoritative; preserve `profiles.role` as the compatibility source during this stage.
3. Add request creation, delegated approval, decision history, and assignment revocation endpoints. Enforce Owner-only administrator changes in the existing guarded endpoint.
4. Migrate one capability family at a time. Compare old and new authorization decisions for existing accounts before switching each consumer.
5. Add regression checks for each RLS operation and API boundary, including inactive users, out-of-scope reviewers, self-approval, revoked delegation, duplicate requests, and Owner-only admin changes.
6. Remove legacy role reads only after the inventory is complete and parity is verified. Do not drop `profiles.role` in the first rollout.

## Release boundary

The first implementation should be a draft PR with migration and application code only. Do not apply the migration to Production, change existing assignments, merge, or deploy until the preview schema and authorization checks are reviewed. No paid service is required for this foundation.
