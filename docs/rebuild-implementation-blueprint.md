# L&F App Rebuild Implementation Blueprint

Status: product decisions captured for planning. This document describes the intended L&F app; the current `/rebuild-preview` remains a sample-only design and does not implement these rules or change Production.

## Product purpose

The app is the digital home for Lost and Found Ministries. It should help adults grow in Christ, take part in Scripture-centered studies and ministry, receive prayer, and serve with clear responsibilities. It should make the next useful step easy to find without turning ministry into a popularity feed or activity score.

The app is free to members. Do not add paid services or new recurring infrastructure without a cost review and explicit approval. Reuse the current L&F authentication, ministry membership, and data foundations where they fit; do not create a second account or group system.

## Existing access foundation (repository review)

This inventory combines checked-in source with a read-only listing of public-schema table and column metadata from the connected L&F Supabase project (`lostandfoundproject26's Project`). No user row values were read and no database writes were made. The listing verified `profiles`, `ministry_memberships`, `study_groups`, `study_group_members`, and `facilitator_supervision` exist with RLS enabled; it also showed the four-value profile role constraint and the current membership/status fields summarized below. The public schema contains 177 tables and includes L&F alongside Emmaus and Rare Network table families, so any future migration must stay narrowly scoped and preserve each product's objects. No general L&F role-request, group-request, invitation, delegation, or audit table appeared in the listing; the separate Rare Network audit/role tables are not L&F authorization. A read-only listing of the connected `lfp-release-staging-20261112` project returned only nine public tables and omitted the L&F membership/group relations, so staging is not a complete schema baseline. This is schema metadata only, not a full audit of policies, triggers, live row contents, or every consumer; verify those before designing migrations.

- **Sign-in and profiles:** Supabase Auth users are paired with one `public.profiles` row by the `handle_new_user` trigger. The checked-in profile role constraint allows `member`, `facilitator`, `supervisor`, and `admin`. There is no L&F `owner` role in this constraint. The current admin role endpoint authorizes any effective admin to assign roles, including `admin`, with a last-admin guard; it does not enforce the agreed Chad/Chrissy Owner boundary. New administrator grants and removals therefore need an explicit server-side Owner guard before implementation.
- **Ministry participation:** `public.ministry_memberships` uses a fixed ministry-slug list and `member` / `leader` membership roles. Members can join and leave their own ministry membership; admins can update rows. This represents ministry participation and leadership for those slugs, not a general, approved role catalog.
- **Study groups:** `public.study_groups` and `public.study_group_members` are separate from ministry memberships. Group rows currently hold `member` or `facilitator` plus `active` / `inactive` status. The checked-in policies allow a participant to read their own membership, facilitators/admins to read the roster, and admins to manage group rows. These relations do not represent pending join requests or invitations.
- **Supervision and delegation:** `public.facilitator_supervision` records supervisor-to-facilitator relationships for the existing study workflow. It is not a reusable, expiring delegation of a specific decision type and group/role scope.
- **Requests and invitations:** No general role-request, group-request, invitation, or scoped-delegation tables were found in the migrations reviewed. Study-session invitations are a separate workflow and should not be reused as group invitations.
- **Profile sharing:** The checked-in profile baseline includes identity, contact, faith-story, and Scripture fields with row-level profile access; the migrations reviewed do not define per-field directory-sharing preferences. The new field-by-field sharing experience needs explicit storage and row/field-safe reads, not a broader profile query.
- **Separate product roles:** `companion_memberships` has its own `owner` role for Study Companion. That role is product-specific and does not grant L&F Owner access.
- **Emmaus sign-in handoff (repository review):** L&F requires an authenticated user, verified email, and `EMMAUS_SSO_SECRET`, then signs a short-lived (120-second) HMAC assertion containing the L&F Auth user ID, email, display name, and a validated destination path. The Emmaus receiver validates the signature, issuer, audience, and expiry, then establishes an Emmaus Supabase session and records the cross-product identity in its protected `emmaus_identity_links` table. Therefore the login is connected, while each product retains its own Auth identity; do not treat the two internal user IDs as interchangeable. This handoff does not sync studies or progress. Before enabling account removal, inventory Emmaus user data through the identity link and define export, deletion, partial-failure, and retention behavior on both sides; do not claim cross-product deletion until both sides complete it.

**Build implication:** retain the existing Auth user and profile identity and preserve both current membership systems and their history. Before changing access, map the deployed rows and consumers, then decide how approved L&F roles, group requests/invitations, Owner authority, field sharing, and expiring delegation extend the existing model. Do not turn the sample preview controls into live writes until server-side checks, RLS, audit behavior, and rollback are reviewed.

### Provisional role map for implementation planning

This table is a mapping proposal based on the existing schema and approved product boundaries. It is not a grant of access or a final role catalog.

| Product concept | Existing representation | Intended boundary to preserve |
| --- | --- | --- |
| Member | `profiles.role = member`; basic account access | Personal account, own records, and accepted group participation; no ministry or administrative authority by default. |
| Group participant | `study_group_members.role = member` with active membership | Access only to that accepted group’s shared content and events. |
| Study facilitator | `profiles.role = facilitator` plus a group assignment | Facilitator tools only for explicitly assigned groups; the global profile value alone should not expose every group. |
| Supervisor | `profiles.role = supervisor` plus `facilitator_supervision` relationships | Supervision information only for assigned facilitator relationships and their explicitly scoped work. |
| Ministry leader | `ministry_memberships.membership_role = leader` for a ministry slug | Leadership tools only inside that ministry; this is distinct from study facilitator or system administrator. |
| Administrator | `profiles.role = admin` | Site administration within an approved boundary; cannot grant or remove administrator access. |
| Owner | Separate Owner authorization for Chad and Chrissy, not an existing profile-role enum value | Owner-only actions, especially granting/removing administrators, with server-side account-ID checks and an audit record. |

**Recommended authorization rule:** require both the approved capability and its explicit scope relationship for scoped tools. A role name by itself should not grant access across all groups, ministries, assignments, or private records. Resolve the two Owner accounts to stable user IDs from an approved identity source before implementation; do not rely on email text or a hidden interface control.

### Live RLS policy notes (read-only)

A read-only catalog query of `pg_policies` checked policies on the five L&F access tables above. It did not read member rows and is not a full security audit.

- **Profiles:** signed-in members can select their own profile; the community-admin helper can select profiles across members. The checked update policy limits a member to their own row, with column grants controlling editable fields. These row policies do not provide member-controlled, field-by-field directory visibility.
- **Ministry memberships:** members may insert their own row only with `membership_role = member`, select their own rows, and delete their own rows. Admins can select, update, or delete membership rows. This is direct join/leave behavior, not a pending approval flow.
- **Study groups:** active participants and admins can read a group; admins manage group records. A member can read their own group-membership row, while facilitators and admins can read the group's roster. Admins manage membership rows; the reviewed policy set does not let facilitators change them.
- **Facilitator supervision:** the assigned supervisor and facilitator can read their relationship; admins manage it. It remains narrower than general delegation.
- **Prayer requests:** signed-in members can insert their own requests only while active, select and update their own rows, and admins can select/update/delete through the current policy set. The current API requires sign-in. The live public/private and moderation columns cannot encode the approved visitor-only-public-after-clearance rule or a member-selected group/Prayer-team audience. The checked `set_prayer_request_defaults()` trigger only fills a care-level value; it does not change the public or moderation defaults. The preview's stricter flow is therefore a future requirement, not a claim about the existing application.
- **Preferences and notifications:** members can select, insert, and update only their own `user_settings`; the checked columns include email, reaction, giving-impact, campaign, and annual-report preferences, with existing defaults enabled. Members can read/update/delete their own notification rows and manage their own push-subscription records. `notifications` also contains delivery-state fields, so new settings must map to the existing channel behavior and preserve history.
- **Administrator boundary:** the checked policies rely on the existing admin role or helper. They do not encode the agreed Chad/Chrissy Owner-only ability to grant or remove admin access.

These observations describe the current policies on these selected tables only. Check database functions, grants, views, storage, and every application route before any real access change.

## Draft data mapping (not a schema specification)

This mapping translates the approved experience into the existing source model. It proposes no migration or live-data change; confirm the deployed schema, existing rows, and all consumers before choosing implementation details.

| Product need | Existing foundation to preserve | Current gap and implementation guard |
| --- | --- | --- |
| One L&F account and immediate member access | Supabase Auth user and its profile row | Keep one identity. Confirm the deployed signup trigger and adult eligibility flow before changing signup. |
| Group participation | `study_groups` / `study_group_members`; preserve their IDs and history | Keep group membership separate from account membership and roles. Add request/invitation states only after mapping existing group joins and consumers. |
| Ministry participation | `ministry_memberships` | Its `member` / `leader` value currently mixes participation with leadership. Map each ministry before separating or transforming that meaning. |
| Scoped ministry roles | Existing global profile roles and study-group facilitator assignments | No general request or scoped-role grant model was found in reviewed migrations. Define the role catalog and map each existing facilitator, supervisor, and leader use before introducing new scope records. |
| Role/group decisions | Existing membership and admin actions | No general approval queue or decision audit table was found in reviewed migrations. Each decision needs exact scope, actor, outcome, optional reason, time, and a requester-visible state. Approval of a group request must never grant a ministry role. |
| Delegated review | `facilitator_supervision` for a specific study supervision relationship | Do not repurpose supervision as delegation. A future grant must name one reviewer, decision type, exact scope, grantor, and end date; exclude self-approval, onward delegation, and admin authority. |
| Owner-only administrator control | `profiles.role = 'admin'` and the current admin route | Add server-side Owner authorization before any new admin grant/removal. Resolve Chad and Chrissy to stable account IDs from an approved identity source; never rely on a hidden UI control or email text alone. |
| Field-by-field profile sharing | Existing `profiles` fields and self-profile access | No per-field sharing preferences were found in reviewed migrations. Keep directory queries limited to explicitly shared fields and enforce the audience in server-side reads/RLS. |
| Prayer intake and audience privacy | `public.prayer_requests` and the existing authenticated submission route | The live table has `user_id` nullable but only active signed-in members can insert through the current route/RLS. The stored audience is only `is_public`; no group or Prayer-team audience is represented. The live column defaults are public and approved, while the current defaults trigger only supplies care level. The product’s visitor-clearance flow and member-selected group/Prayer-team audiences are not implemented in this foundation. New intake must force visitor requests into a hidden pending state and preserve a member’s exact audience through moderation; verify the feed view and all write paths before any release. |
| Notification settings and push | `user_settings` stores email/reaction/giving preferences (existing defaults are enabled); `notifications` keeps in-app history and push-delivery state; `push_subscriptions` stores each device endpoint | Reconcile the agreed notification categories and channels with existing columns. Preserve notification history and current per-user/per-device RLS; do not add a paid delivery service or treat the sign-in push prompt as an automatic subscription. |
| Auditability | No general role, group-decision, or delegation audit table was found in reviewed migrations | Preserve history for role grants/removals, decisions, delegation changes, and prayer moderation with actor, scope, outcome, timestamp, and reason when supplied. Define retention before enabling real writes. |

## Confirmed product rules

| Area | Agreed behavior |
| --- | --- |
| Audience | Adults only for the initial release. |
| Account membership | A person becomes an L&F member immediately after sign-up. |
| Ministry roles | Every additional role requires approval for the exact role and scope. A group membership alone does not grant a ministry role. |
| Administration | Chad and Chrissy are Owners. Only Owners can grant or remove administrator access. |
| Delegated review | Delegation can authorize scoped role or group decisions. A reviewer cannot approve their own request, expand scope, delegate onward, or grant administrator access. |
| Groups | Group participation is separate from L&F membership and ministry roles. A member can request, accept, or leave a group without changing their account or other roles. |
| Member messaging | No member-to-member messaging in the initial app. Care follow-up uses an existing trusted channel. |
| Visitor prayer | Visitors can submit prayer requests without an account. The request is public only after authorized review; visitors cannot select a private audience. |
| Member prayer | Members can choose Prayer team only, an accepted group, or public after review. The initial audience is Prayer team only. Moderators cannot broaden the member’s choice. |
| Events | Member events are free. Show audience, age requirement, availability, and cost before registration. |
| Profiles | Members control sharing field by field, including whether their directory information appears. The preview uses private-by-default as the proposed baseline; confirm the defaults before implementation. |
| Notifications | Categories start enabled; members can opt out of each category. Prompt for push notifications at sign-in, then honor the device permission and the member’s preferences. |
| Leaving L&F | Members should be able to take their information with them when leaving, through a complete export and removal flow covering L&F and connected Emmaus data. |
| Emmaus | L&F already has a signed single-sign-on handoff to Emmaus. Treat this as authentication continuity only; it does not establish that study content or progress is synchronized. Sharing or syncing remains a separate feature requiring explicit scope and consent. |

## Product surfaces

### Public

- Welcome page centered on the approved design direction and Luke 19:10.
- Public Prayer & Praise page showing only content cleared for public viewing.
- Visitor prayer form explaining the public audience before submission.
- Sign-in and sign-up entry points, with adult-only eligibility.
- Public ministry and event information that an administrator has chosen to publish.

### Member home

- Personal home with relevant studies, accepted groups, upcoming eligible events, prayer activity, and assigned next steps.
- My groups with group details, rules, requests, invitations, and a scoped leave review.
- Roles & requests showing baseline membership, group participation, current approved access, pending requests, and the exact scope of a new request.
- My studies and an Emmaus handoff. Do not imply Emmaus progress is synced until it is built and authorized.
- Personal calendar, showing events visible through the member’s own access or assignments.
- Prayer submission with member-selected audience, defaulting to Prayer team only.
- Profile sharing, notification preferences, push opt-in, data export, and account removal under Settings.

### Administration

- Command Center with a concise attention queue, schedule, and links to current work.
- Master calendar with filters for category, ministry, role, assignment, and personal/master scope.
- People & roles with shared-profile directory, role requests, group requests, group roster, current access, and delegated review.
- Prayer review separating visitor requests, member requests, and cleared public items.
- Events, registration review, and drafts; no payment collection.
- Studies planning and group pacing, clearly separated from member study continuation and Emmaus.
- Work queues limited to the administrator’s approved roles and assigned responsibilities.

## Access and audience model

Treat each kind of access as independent data. Keep a member record, group membership, ministry role, and assigned task as separate relationships.

| Principal or audience | May access | Must not imply |
| --- | --- | --- |
| Visitor | Public pages and visitor prayer form | Private prayer, member profiles, or member areas |
| L&F member | Personal home, own requests, own profile and preferences, public content, and groups they joined | Any ministry role or access to another member’s private content |
| Group participant | Content explicitly shared with that accepted group | An approved leadership or ministry role |
| Approved role holder | Tools and information for the exact role and scope | Access to another role, group, or ministry |
| Assigned worker | The specific work item assigned to them | A general role, directory access, or private prayer note unrelated to the assignment |
| Delegated reviewer | The delegated decision type and exact scope through its end date | Self-approval, broader scope, onward delegation, or administrator access |
| Owner | Owner-level controls, including granting or removing administrator access | Unlogged or invisible access changes |

Use server-side authorization and database row-level policies for every private read and write. Hiding a control in the interface is not access control. Record role grants, removals, delegation changes, and moderation decisions with actor, scope, reason where supplied, and time.

## Core workflows

### Sign-up and access

1. Create the account and activate baseline L&F membership.
2. Ask for profile and directory sharing choices separately; default each field to private.
3. Show the member’s personal home and explain how group participation and ministry roles differ.
4. Route additional role requests to a reviewer authorized for the exact role and scope.
5. Prevent self-approval; show request state and reviewer outcome to the requester.

### Role and group approvals

1. The reviewer sees the requester, requested role or group, exact scope, training/evidence when applicable, and their authority boundary.
2. Before a decision, show the exact outcome. Require confirmation that the reviewer is authorized and is not approving their own request.
3. An optional decline reason is returned to the requester through an approved notification channel.
4. A group decision changes group participation only. A role decision changes only that approved role and scope.
5. A delegated decision is constrained by its recorded end date; expiration removes decision authority automatically.

### Prayer moderation

1. Keep visitor requests hidden from public pages while pending.
2. Before clearing a visitor request, identify the content that becomes public and require explicit acknowledgement of that audience.
3. For a member request, preserve the audience chosen by the member through moderation and publication.
4. Keep private member requests out of public feeds and public-facing counts that could reveal them.
5. Keep prayer activity repeatable; do not use public leaderboards or popularity rankings.

### Data portability and departure

1. Let a member request a complete personal export in a readable, portable format.
2. Include their profile, preferences, authored content, prayer activity, group and event history, study activity, and connected Emmaus data that L&F can provide.
3. Explain what account removal deletes and what shared content other people may still need to see.
4. Delete the member’s L&F and connected Emmaus personal data after confirmation, subject to the retention policy established before release.
5. Provide a completion receipt without retaining a copy of the exported personal data.

## Build sequence

1. **Inventory and map data:** identify current tables, routes, triggers, scheduled work, integrations, storage, and RLS policies. Preserve current content and history.
2. **Define authorization:** settle role names, scopes, Owner accounts, group rules, reviewer boundaries, delegation expiry, and audit events before changing permissions.
3. **Build the shared shell and navigation:** public, member, and administration surfaces with accessible mobile layouts and role-aware entry points.
4. **Build member access and privacy:** sign-up, profile controls, notification preferences, prayer audiences, groups, and role requests.
5. **Build administration workflows:** command center, scoped approvals, delegation, roster management, prayer moderation, events, calendar, studies, and assigned work.
6. **Connect push and Emmaus:** use the existing login connection; add no study or progress synchronization until member consent, data ownership, and conflict behavior are specified.
7. **Build export and removal:** complete data inventory and deletion/retention mapping across L&F and Emmaus before enabling account removal.
8. **Validate and migrate:** test permissions and data portability with synthetic or staging accounts, verify mobile layouts, and review rollback steps before any Production change.

## Product decisions already approved

The following decisions are captured from the planning conversation and should not be reopened during implementation:

- Account creation activates basic L&F membership immediately; every ministry or elevated role still requires approval.
- Chad and Chrissy are the L&F Owner accounts. Owner authority is separate from ordinary administrator roles and must be enforced server-side.
- Members control profile sharing at the field level and can opt out of individual notification categories. Notifications begin enabled, and the app prompts for push permission at sign-in.
- Visitor prayer requests may be submitted without an account, but stay hidden until cleared by an authorized moderator; once cleared, they are public. Private prayer is available only to signed-in members, who choose the audience.
- Delegated approvals are part of the approval workflow, with scope and expiry enforced.
- The app is adults-only, free to use, and has no member-to-member messaging in the initial release.
- Leaving the app includes taking a portable export and removing the member’s L&F personal data and connected Emmaus personal data, subject to clearly explained legal/operational retention limits.
- Emmaus sign-in already uses the cross-product handoff described above. Study/progress synchronization remains a separate, consent-based future feature.
- Reuse the existing L&F identity and membership foundation where it fits; keep the rebuild sample-only until the access, privacy, and migration work is reviewed.

## Remaining implementation details

These details still need a written specification before their respective features are built:

- Final role catalog, training or evidence requirements, reviewer for each role and scope, and which roles any member may request.
- Which roles may delegate each decision type, maximum delegation duration, renewal, revocation, and what happens to an in-flight decision when a delegation expires.
- Complete profile field list, sharing default for each field, directory audiences, and protections for contact details.
- Exact notification categories, channels, delivery rules, and behavior when device-level push permission is denied.
- Adult eligibility check and the minimum personal information needed to enforce it.

**Privacy-minimizing proposal for review, not an approved implementation rule:** put an “I am 18 or older” confirmation before account creation and before visitor prayer submission, without asking for or storing a full birth date. For an account, record only the member’s age-confirmation state and policy version/timestamp if an auditable record is needed. For visitors, use a required confirmation without retaining an identity record. This is an eligibility gate, not identity-verified age assurance; specify a stronger method only if ministry policy, legal review, or a platform requirement calls for it.
- Export format and departure treatment for public prayer, group-owned resources, shared studies, accounting records, and Emmaus data.
- Retention periods for visitor requests, declined requests, moderation/audit records, and account-departure records, including partial failure handling between L&F and Emmaus.

These implementation details are not permission to change Production. The rebuild preview remains synthetic and sample-only until data, permission, privacy, migration, and rollback plans are reviewed.
