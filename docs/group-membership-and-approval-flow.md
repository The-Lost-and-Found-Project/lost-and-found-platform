# Group membership and approval flow

Status: product and authorization design proposal for review. This document adds no schema, routes, or Production behavior.

## Approved product foundations

- The app serves adults only.
- Signup creates baseline L&F membership immediately.
- Any additional role or ministry capability requires approval.
- Group membership is separate from app membership and from role assignments.

## Existing data structures and implementation boundary

A read-only repository audit found two existing membership systems with different purposes:

- `ministry_memberships` represents follows/participation in the current ministry spaces. It stores one row per member and ministry, with `membership_role` set to `member` or `leader`. The current join action inserts a member row immediately; leaving deletes it. Its current policies let a member read, join, and leave their own ministry membership, while administrator access can manage records. The `leader` value is also used to authorize ministry content management, so membership and authority are currently coupled.
- `study_groups` and `study_group_members` represent Bible-study cohorts. They track `active`/`inactive` membership and `member`/`facilitator` group roles. Current policies let members see their own membership, facilitators see their cohort roster, and administrators manage groups and memberships. This model is tied to study sessions and should not automatically become the home for every fellowship or service team.

Neither model currently stores open/request/invitation access modes, pending requests, invitation acceptance/expiry, membership decision history, or field-level profile-sharing choices. The current ministry join action is a direct authenticated insert, so access rules cannot safely be implemented only by hiding or changing a button. Current role values (`membership_role` and `group_role`) also carry authority and must not be silently reinterpreted as the new scoped-role system.

Implementation should first classify each product group as a ministry space, Bible-study cohort, or a genuinely different community group. Reuse the existing ministry and study records where their semantics fit. Do not duplicate either system or turn study cohorts into generic groups for convenience. If a new shared group model is needed, document the mapping and migration path before adding it; requests and invitations must link to a stable group identity and be enforced by server authorization and database policy.

- Groups may be open, approval-required, or invitation-only.
- Group participation is free. The app does not add member-to-member messaging.
- Members control which profile fields are shared. A group join must not publish a member's profile or group affiliations publicly.

## Recommended member flow

1. An adult creates an account and becomes a baseline member immediately. No ministry or leadership role is granted by signup.
2. The signed-in member browses groups that are open or approval-required. Invitation-only groups are not listed publicly; an authorized group inviter can invite an existing member.
3. The member sees the group's purpose, ministry, access rule, leader contact route, meeting information, age requirement, and any relevant participation expectations before joining or requesting access.
4. Open group: selecting **Join** activates group membership immediately. It does not grant a staff role.
5. Approval-required group: selecting **Request to join** creates a pending membership request. A group leader or a person explicitly delegated to approve membership in that group may approve or decline it. The requester cannot approve their own request.
6. Invitation-only group: an authorized inviter sends an invitation to an existing member. The member must accept before membership becomes active. An invitation does not grant a ministry role.
7. The member can review pending requests, invitations, and active groups from **My groups & ministries** and can leave a group without deleting their L&F account.

## Recommended membership states

| State | Meaning | Member action |
| --- | --- | --- |
| `pending` | The member requested access and a decision is due | Withdraw request |
| `invited` | An authorized inviter offered access | Accept or decline |
| `active` | Membership is current | View group or leave |
| `declined` | A request or invitation was declined | Request again only if group policy allows |
| `left` | The member left voluntarily | Rejoin or request again under the current access rule |
| `removed` | An authorized group leader removed membership | Contact the group through the displayed ministry route |
| `expired` | An invitation expired before acceptance | Ask an authorized inviter for a new invitation |

Every decision records who acted and when. A declined or removed member must not be shown publicly or messaged by other members through the app.

## Keep group access and role authority separate

Group membership answers: **May this member participate in this group?**

A role assignment answers: **May this person perform a defined ministry task, and within what scope?**

Therefore:

- Joining or being invited to a group never grants `ministry_leader`, `prayer_team`, `moderator`, `study_facilitator`, or another elevated role.
- Leaving a group does not silently grant another role or transfer responsibility. A group-scoped role must be suspended from group work pending an authorized role review; its history remains auditable.
- Membership approvers may approve membership only for the exact group scope delegated to them. Role grant and revocation remain on the separately authorized role workflow.
- Delegation is limited to named actions, group scope, and an effective period. A delegate cannot approve their own request, create another delegate, expand their scope, or grant a role unless those powers are explicitly and separately delegated by an authorized Owner or administrator.
- Owner-only administrator authority remains governed by the existing Owner guard and cannot be delegated through ordinary group membership.

## Privacy and notifications

- Group discovery must not reveal membership rosters to visitors.
- The group roster is available only to active members of that group and authorized group leaders. Show only profile fields that the member opted to share with that audience; never expose hidden contact details.
- Group affiliation is not added to a public profile by default. A member may choose whether to share each group affiliation, separately from other profile fields.
- Membership requests, decisions, invitations, and role requests are distinct notification categories. Notifications start enabled, and a member can opt out of individual categories. The sign-in push prompt is optional and must not block access.
- Do not include private prayer details or care notes in group rosters, membership queues, or notifications.

## Review and audit requirements

For each request, invitation, approval, decline, withdrawal, removal, and delegation change, retain the actor, subject, group, prior state, new state, timestamp, and optional reason. Prevent state changes from an unrelated group scope, inactive accounts, and self-approval. Enforce the same boundary in server authorization and database policy; hiding a button is not authorization.

Approved account-departure direction preserves the minimum identifiable audit history needed for accountability as a narrow exception to removing ordinary member data. Keep the stable actor reference and only the minimal identity snapshot needed to attribute actions; never copy prayer text, contact details, or care information. A 90-day post-departure retention window is a tentative Owner proposal, not a final policy. The start point, deleted-subject reference behavior, and whether non-identifying event metadata remains afterward still need approval before schema work.

## Recommended starting choices for remaining group decisions

These are review-ready recommendations, not approved policy and not implemented behavior. Confirm them with ministry leadership before building persistence.

| Decision | Recommended starting choice | Boundary |
| --- | --- | --- |
| Member roster visibility | Keep no searchable member-facing directory in the initial release. Within a specific group, show a roster only to active members of that group and authorized group leaders. Show only fields the member explicitly shared with that audience; keep contact details, private prayer, care notes, and hidden profile fields out. | A scoped group roster is not a global member directory. The exact minimum identifying field needed for participation still needs ministry confirmation. |
| Group taxonomy | Map each offering first to an existing ministry space or Bible-study cohort when its purpose fits. Add a new shared community-group type only when a real use case cannot fit either model, with a documented mapping and migration plan. | Do not duplicate the existing ministry or study-group systems or infer role authority from the group category. |
| Declined, left, or removed members | A declined request or voluntary departure may be followed by a fresh request under the group's current access mode. Removal ends access immediately; rejoining requires a new request or invitation and a fresh authorized decision. | No automatic restoration. Preserve the removal and any later decision in the audit history. |
| Capacity and join controls | No capacity limit by default. If a group sets a limit, stop new open joins when full and route any permitted request to a pending state; never remove existing members automatically. Let only a person explicitly authorized for that group's settings pause or close joining. | The group-specific authority and exact full-group behavior must be configured and audited. |
| Invitation expiry | Use a 14-day default expiry with an explicit expiry timestamp. An expired invitation grants no membership; an authorized inviter may issue a new invitation. | Expiry changes only invitation availability, never membership or role assignment. |
| Group-scoped role on departure/removal | Suspend the role's group-scoped capabilities as soon as group membership ends; retain the assignment and decision history. Restoration requires a separate authorized role review. | Do not silently widen the role to another group or delete the audit record. |

### Remaining decisions before implementation

1. Confirm the minimum group-roster fields and the audience-specific sharing control.
2. Confirm the group taxonomy and any genuine need for a new shared group model.
3. Confirm the rejoin, capacity, and 14-day invitation recommendations above, including who can manage each group's join settings.
4. Confirm that membership end/removal immediately suspends group-scoped role capabilities, with separate review required for reinstatement.

Do not implement these recommendations until the decisions are confirmed. The existing app, schema, and Production authorization remain unchanged.

## Preview acceptance checks

- The screen labels app membership, group membership, and ministry role approval separately.
- Open, approval-required, and invitation-only groups show different available actions.
- A membership approval never creates a role assignment.
- Pending, invited, active, and ended states are understandable on mobile and by nontechnical members.
- Group membership is absent from public views unless the member chooses to share it.
- Every control in the design preview remains sample-only; no real member or group record is changed.
