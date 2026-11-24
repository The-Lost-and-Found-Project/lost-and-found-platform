# Role approval and delegation matrix

Status: reviewer-scope policy approved for planning; this document does not change database schema, live authorization, or existing permissions.

## Policy already established

- Signup grants baseline L&F membership immediately.
- Every additional role requires approval.
- Delegated approvals are needed.
- Non-admin role requests go only to people explicitly assigned the exact role type and ministry/group scope. An Admin title alone grants no blanket approval authority. Ministry leaders may review only when explicitly delegated that exact scope. Reviewers cannot grant authority beyond their own.
- Chad and Chrissy are the only people who may grant or remove administrator access; that authority cannot be delegated.
- A person may not approve their own request.
- Configured Owners retain exclusive authority over administrator access, integration changes, and paid-service authorization.
- Group membership and role assignment are separate decisions; group access alone does not grant a role.

## Verified current-state evidence

The existing single-role path is documented separately from the proposed workflow:

- Draft PR #253's `set-role` route accepts only `member`, `facilitator`, `supervisor`, and `admin`. It requires an active Admin caller. Granting or removing `admin` additionally requires a configured Owner identity; the existing last-admin guard remains.
- That route writes the profile role directly. It does not create a request, decision history, scoped assignment, or delegated approval record.
- The existing supervision route lets an active Admin assign or remove a `supervisor` to `facilitator` relationship. It is not a general delegation mechanism and does not grant role-approval authority.
- PR #253 remains a draft and has not changed Production. Its Owner allowlist only affects a future deployment of that code.

These facts establish the compatibility boundary. The reviewer-scope rule below is approved for planning, not deployed behavior.

## Proposed approval matrix

| Request | Default reviewer | Delegated review | Boundary |
| --- | --- | --- | --- |
| Baseline account membership | Automatic at successful signup | Not applicable | No ministry, group, or staff role is implied |
| Join an open group | Automatic group membership | Not applicable | Does not create a role assignment |
| Join an approval-required group | Authorized approver for that exact group | Yes, only with a separate group-membership approval delegation | Approves participation only, never a role |
| Invitation-only group | Authorized inviter issues; member accepts | Invitation authority must be explicitly scoped | Invitation and acceptance create group membership only |
| Scoped ministry or group role, such as `prayer_team`, `study_facilitator`, or `ministry_leader` | A reviewer explicitly assigned that exact role type and ministry/group scope | Yes, only through an explicit, current delegation for that role and scope | Admin or ministry-leader title alone is insufficient; self-approval is prohibited |
| Administrator access | Configured Owners only | No | Never available through ordinary role delegation or group membership |
| Integration changes or paid services | Configured Owners only | No | Owner authorization remains separate from ministry roles |

The scoped-review rule is approved for planning. It does not change current behavior: the existing system still allows active administrators to assign `member`, `facilitator`, and `supervisor`. Before implementation, identify the named reviewer for each role/scope and define any training or evidence requirements.

## Delegation record and limits

A delegation should name:

- the delegator and delegate;
- the exact action (`approve_group_membership` or `approve_role_request`);
- allowed role types, when approving roles;
- one explicit scope kind and ID, or a deliberately authorized global scope;
- start time, end time, creation time, revocation time, and the actor who changed it;
- an optional reason and the originating owner/admin approval.

Enforce these limits:

1. The delegator must currently hold authority for every delegated action, role type, and scope.
2. The delegate must be an active L&F member. A delegation does not grant the underlying ministry role or create public profile visibility.
3. The delegate cannot approve their own request, alter the delegation, extend its dates or scope, or create a sub-delegation.
4. A group-membership delegation cannot approve ministry roles. A role-approval delegation cannot add or remove group membership unless that action is explicitly included as a separate authority.
5. Delegation expires at its end time and becomes unusable if revoked or if the delegator's authority is revoked. Preserve the record for audit.
6. Admin-role, integration, and paid-service authority cannot be delegated.
7. Decision screens show the requested role/scope, the reviewer's authority source, and any delegation expiration before confirmation.

## Request and decision flow

1. Member submits one role request for a specific role and scope. A duplicate active request for the same role/scope is blocked or linked to the existing request.
2. The server resolves eligible reviewers from explicit role-and-scope assignments and valid delegations. An Admin or ministry-leader title alone is insufficient. The client cannot choose or claim an approver.
3. The reviewer sees only requests in their authority scope. A requester cannot review their own item.
4. Approval creates an auditable assignment linked to the request. Decline records reviewer, time, and optional reason. Neither decision rewrites the request history.
5. Reassignment of a pending request is a distinct audited action. It does not erase the original reviewer or any decision.
6. Revocation records who acted, when, and why; it does not delete the historical assignment or past approvals.

## Minimum security checks

Test the allow and deny cases for: active Owner, active Admin, properly delegated reviewer, expired/revoked delegation, out-of-scope reviewer, unsupported role, inactive member, self-approval, duplicate request, delegated administrator request, delegation chaining, and an attempt to change another group's membership. Enforce these checks on the server and database boundary; a hidden or disabled button is not a permission check.

## Delegation duration proposal (not approved)

- Default term: 30 days; maximum term: 90 days.
- Every grant has explicit start and end timestamps. A grant may be revoked immediately by an authority that can issue it.
- Renewal creates a new grant with a new end date and audit entry; delegates cannot extend their own authority.
- When a grant expires or is revoked, unfinished requests return to the standing queue for that exact scope and remain pending. Expiry never approves a request automatically.

## Decisions still open before implementation

1. Accept or change the proposed 30-day default and 90-day maximum, including whether every grant must have an end date.
2. Decide whether high-trust roles such as `moderator` or `prayer_team` need one reviewer or two independent approvals.
3. Identify the named reviewer for each approved role/scope and define any training or evidence requirements.
