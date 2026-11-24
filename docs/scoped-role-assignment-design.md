# Scoped role assignment foundation

Status: implementation design for review. This document does not change database schema or live authorization.

## Product rules

- Signup creates a member account immediately.
- Every capability beyond baseline membership requires an explicit approval.
- A person may hold several roles at once; role assignments carry their ministry or group scope.
- Group participation has a separate lifecycle from role assignment; joining a group never grants authority. See `docs/group-membership-and-approval-flow.md`.
- An approver may act only inside the role types and scopes explicitly delegated to them.
- Chad and Chrissy, as configured Owners, may review all non-admin role requests across scopes and may appoint additional reviewers for exact role/scope assignments. Self-approval remains prohibited and high-trust prayer roles require two independent approvals. Admins and ministry leaders have no blanket review authority. See `docs/role-approval-authority-matrix.md`.
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

Use a role key separate from the old profile enum for the approved initial roles: `study_facilitator`, `ministry_leader`, and `prayer_team`; model `serve_team` and `supervisor` only with the approved scopes and transition plan. Preserve existing global access during migration. `moderator` and `content_creator` are Owner-assigned, non-requestable roles; configured Owners Chad and Crissy are the intended initial assignees. See the role definitions in `docs/role-approval-authority-matrix.md`. These are planned assignments, not live grants. Keep administrator access in the existing Owner-guarded path; do not make an ordinary role assignment an alternate way to grant admin.

Scope should be explicit: `global`, `ministry`, `group`, `content_collection`, or `workflow`. A global assignment must have no scope ID; a scoped assignment must have exactly one valid scope reference. Ministry scope uses the ministry's stable slug or ID consistently with the existing ministry tables; group scope uses the existing group identifier; content collection and workflow scopes use stable, validated identifiers. The `moderator` role is limited to workflow `public_visitor_prayer_queue`; `content_creator` requires an explicit content collection assignment. Do not infer a scope from the role label.

For `moderator`, allow viewing pending visitor-submitted public prayer requests and recording approve-for-public-display, decline, or hold/escalate decisions. Exclude private/member prayer requests, audience changes, request text edits, unrelated profile/care data, and role administration. For `content_creator`, allow creating, editing, and submitting drafts only in assigned collections. Exclude publication, approval, archiving, other creators' drafts absent a separate assignment, and private member data. Publishing is a distinct capability and requires a separately authorized publisher/reviewer. These controls must be enforced on server and database boundaries, with auditable decisions.

Before activation, a moderator completes prayer privacy, public moderation, and escalation training. A content creator completes Scripture-first editorial, source/copyright, and review-workflow orientation. Chad or Crissy appoints the verifier; neither person may self-certify. Training verification does not itself grant either role.

Request states: `pending`, `approved`, `declined`, `withdrawn`, and `cancelled`. A decision records the reviewer, time, and optional reason. Reassignment is a separate audited action, not an overwrite of the original reviewer. Uniqueness prevents duplicate active assignments for the same user, role, and scope.

## Authorization and RLS boundary

- Enable RLS on all new tables and explicitly revoke direct client writes. Requests and decisions go through authenticated server routes that validate the caller, active account, authority, role, scope, and request state before a service-role write.
- Keep service-role clients server-only. Every service-role route must repeat its authorization check; RLS bypass is not authorization.
- Allow a member to read their own requests and assignments. Allow staff to read only the work and scope their authority permits. Do not publish role requests or assignment data to anonymous visitors.
- Avoid policies that query the same protected assignment/delegation table recursively. Prefer server-side scoped reads for sensitive review queues until a non-recursive database helper has been independently reviewed.
- Add database-level constraints for valid scope combinations and request transitions. Add audit data that cannot be rewritten by ordinary reviewers.

## Audit history and account deletion

The design requires auditable decisions, while the approved product direction says that leaving members have all of their data removed. Those requirements can conflict when an audit event retains an identifiable actor, subject, or prayer-request reference after account or request deletion. Do not resolve this by silently keeping identifiable records or by deleting history without an explicit policy decision.

Before implementing the audit tables, decide:

- Whether account departure removes linked audit events, anonymizes actor/subject references, or retains a narrowly scoped record for a defined period.
- What happens to moderation events when a prayer request is deleted or an account is removed.
- Whether free-text reasons are needed. Prefer a small reason code; never copy prayer text, contact details, or care information into an audit record.

The audit design should record the minimum needed to reconstruct who acted, on which workflow item, the action, the prior and resulting state, and when. The exact retention, deletion behavior, and reason format remain open decisions. Until they are resolved, role and prayer moderation actions must not be activated.

## Migration sequence

1. Inventory every route, page, component, RPC, trigger, and RLS policy that reads the legacy role. Record whether it grants access, controls presentation, or both.
2. Add the tables and restrictive grants/RLS without changing existing behavior. Backfill the existing facilitator and supervisor facts into assignments only where the source is authoritative; preserve `profiles.role` as the compatibility source during this stage.
3. Add request creation, delegated approval, decision history, and assignment revocation endpoints. Enforce Owner-only administrator changes in the existing guarded endpoint.
4. Migrate one capability family at a time. Compare old and new authorization decisions for existing accounts before switching each consumer.
5. Add regression checks for each RLS operation and API boundary, including inactive users, out-of-scope reviewers, self-approval, revoked delegation, duplicate requests, and Owner-only admin changes.
6. Remove legacy role reads only after the inventory is complete and parity is verified. Do not drop `profiles.role` in the first rollout.

## Release boundary

The first implementation should be a draft PR with migration and application code only. Do not apply the migration to Production, change existing assignments, merge, or deploy until the preview schema and authorization checks are reviewed. No paid service is required for this foundation.
