# Role approval and delegation matrix

Status: proposed authorization policy for review. No permission or database behavior changes in this document.

## Policy already established

- Signup grants baseline L&F membership immediately.
- Every additional role requires approval.
- Delegated approvals are needed.
- A reviewer may act only within explicitly granted role types and scopes and may not grant authority beyond their own.
- A person may not approve their own request.
- Configured Owners retain exclusive authority over administrator access, integration changes, and paid-service authorization.
- Group membership and role assignment are separate decisions; group access alone does not grant a role.

## Proposed approval matrix

| Request | Default reviewer | Delegated review | Boundary |
| --- | --- | --- | --- |
| Baseline account membership | Automatic at successful signup | Not applicable | No ministry, group, or staff role is implied |
| Join an open group | Automatic group membership | Not applicable | Does not create a role assignment |
| Join an approval-required group | Authorized approver for that exact group | Yes, only with a separate group-membership approval delegation | Approves participation only, never a role |
| Invitation-only group | Authorized inviter issues; member accepts | Invitation authority must be explicitly scoped | Invitation and acceptance create group membership only |
| Scoped ministry or group role, such as `prayer_team`, `study_facilitator`, or `ministry_leader` | Active Admin or configured Owner | Yes, only for named role types and exact ministry/group scope | Reviewer must already hold sufficient authority; self-approval is prohibited |
| Administrator access | Configured Owners only | No | Never available through ordinary role delegation or group membership |
| Integration changes or paid services | Configured Owners only | No | Owner authorization remains separate from ministry roles |

The default reviewer row for scoped roles is a proposal. The existing system currently allows active administrators to assign `member`, `facilitator`, and `supervisor`; the new scoped role keys and their approver hierarchy still require review before implementation.

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
2. The server resolves eligible reviewers from current Owner/Admin authority and valid explicit delegations. The client cannot choose or claim an approver.
3. The reviewer sees only requests in their authority scope. A requester cannot review their own item.
4. Approval creates an auditable assignment linked to the request. Decline records reviewer, time, and optional reason. Neither decision rewrites the request history.
5. Reassignment of a pending request is a distinct audited action. It does not erase the original reviewer or any decision.
6. Revocation records who acted, when, and why; it does not delete the historical assignment or past approvals.

## Minimum security checks

Test the allow and deny cases for: active Owner, active Admin, properly delegated reviewer, expired/revoked delegation, out-of-scope reviewer, unsupported role, inactive member, self-approval, duplicate request, delegated administrator request, delegation chaining, and an attempt to change another group's membership. Enforce these checks on the server and database boundary; a hidden or disabled button is not a permission check.

## Decisions to resolve before implementation

1. Confirm whether active Admins may directly approve every non-Admin scoped role or only roles they already manage today.
2. Confirm whether a ministry leader may be a default reviewer for lower-risk requests in their ministry, or only after explicit Owner/Admin delegation.
3. Set a maximum delegation term and whether every delegation requires an end date.
4. Decide whether high-trust roles such as `moderator` or `prayer_team` need one reviewer or two independent approvals.
5. Confirm whether Owners should be able to delegate scoped-role approvals while retaining exclusive control of administrator access, integrations, and paid services.
