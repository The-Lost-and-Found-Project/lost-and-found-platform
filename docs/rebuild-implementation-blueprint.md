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

**Build implication:** retain the existing Auth user and profile identity and preserve both current membership systems and their history. Before changing access, map the deployed rows and consumers, then decide how approved L&F roles, group requests/invitations, Owner authority, field sharing, and expiring delegation extend the existing model. Do not turn the sample preview controls into live writes until server-side checks, RLS, audit behavior, and rollback are reviewed.

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
| Emmaus | The login is already connected. L&F can show a clear Emmaus handoff. Sharing studies or syncing progress is a separate feature requiring its own scope and consent. |

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

## Decisions still needed before implementation

- Final role catalog, training requirements, who may approve each role, and whether any roles may be requested by any member.
- Which roles may delegate each decision type; maximum delegation duration and renewal process.
- The complete profile field list, directory audiences, private-by-default baseline, and how shared contact details are protected.
- Exact notification categories and which channels each category uses.
- Adult eligibility check and the minimum personal information needed to enforce it.
- Whether Emmaus remains a sign-in handoff only, or whether specific study content/progress should sync later; define consent and conflict behavior first.
- Export format and exact departure treatment for public prayer, group-owned resources, shared studies, accounting records, and Emmaus data.
- Retention periods for visitor requests, declined requests, audit records, and member-departure records.

These are implementation gates, not permission to change Production. The rebuild preview remains synthetic and sample-only until the data, permission, privacy, migration, and rollback plans are reviewed.
