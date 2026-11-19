# L&F App Rebuild Implementation Blueprint

Status: product decisions captured for planning. This document describes the intended L&F app; the current `/rebuild-preview` remains a sample-only design and does not implement these rules or change Production.

## Product purpose

The app is the digital home for Lost and Found Ministries. It should help adults grow in Christ, take part in Scripture-centered studies and ministry, receive prayer, and serve with clear responsibilities. It should make the next useful step easy to find without turning ministry into a popularity feed or activity score.

The app is free to members. Do not add paid services or new recurring infrastructure without a cost review and explicit approval. Reuse the current L&F authentication, ministry membership, and data foundations where they fit; do not create a second account or group system.

## Existing access foundation (repository review)

This inventory combines checked-in source with a read-only listing of public-schema table and column metadata from the connected L&F Supabase project (`lostandfoundproject26's Project`). No user row values were read and no database writes were made. The listing verified `profiles`, `ministry_memberships`, `study_groups`, `study_group_members`, and `facilitator_supervision` exist with RLS enabled; it also showed the four-value profile role constraint and the current membership/status fields summarized below. The public schema contains 177 tables and includes L&F alongside Emmaus and Rare Network table families, so any future migration must stay narrowly scoped and preserve each product's objects. No general L&F role-request, group-request, invitation, delegation, or audit table appeared in the listing; the separate Rare Network audit/role tables are not L&F authorization. A read-only listing of the connected `lfp-release-staging-20261112` project returned only nine public tables and omitted the L&F membership/group relations, so staging is not a complete schema baseline. This is schema metadata only, not a full audit of policies, triggers, live row contents, or every consumer; verify those before designing migrations.

- **Sign-in and profiles:** Supabase Auth users are paired with one `public.profiles` row by the `handle_new_user` trigger. The profile defaults to role `member` and `is_active = true`, so baseline membership is provisioned without a role approval. The current sign-up page collects required full name, email, password, and gender; phone is optional, and the form includes a community-guidelines acknowledgement and CAPTCHA. It sends a confirmation email; the account profile exists at Auth user creation, but the member does not reach an authenticated app session until email confirmation succeeds. The adults-only age gate is not present. Review whether required gender is necessary at account creation or should be deferred/optional; do not add a full birth-date field without a separate need. The checked-in profile role constraint allows `member`, `facilitator`, `supervisor`, and `admin`. There is no L&F `owner` role in this constraint. The current admin role endpoint authorizes any effective admin to assign roles, including `admin`, with a last-admin guard; it does not enforce the agreed Chad/Chrissy Owner boundary. New administrator grants and removals therefore need an explicit server-side Owner guard before implementation.
- **Ministry participation:** `public.ministry_memberships` uses a fixed ministry-slug list and `member` / `leader` membership roles. Members can join and leave their own ministry membership; admins can update rows. This represents ministry participation and leadership for those slugs, not a general, approved role catalog.
- **Study groups:** `public.study_groups` and `public.study_group_members` are separate from ministry memberships. Group rows currently hold `member` or `facilitator` plus `active` / `inactive` status. The checked-in policies allow a participant to read their own membership, facilitators/admins to read the roster, and admins to manage group rows. These relations do not represent pending join requests or invitations.
- **Supervision and delegation:** `public.facilitator_supervision` records supervisor-to-facilitator relationships for the existing study workflow. It is not a reusable, expiring delegation of a specific decision type and group/role scope.
- **Requests and invitations:** No general role-request, group-request, invitation, or scoped-delegation tables were found in the migrations reviewed. Study-session invitations are a separate workflow and should not be reused as group invitations.
- **Profile sharing:** The checked-in profile baseline includes identity, contact, faith-story, and Scripture fields with row-level profile access; the migrations reviewed do not define per-field directory-sharing preferences. The new field-by-field sharing experience needs explicit storage and row/field-safe reads, not a broader profile query.
- **Separate product roles:** `companion_memberships` has its own `owner` role for Study Companion. That role is product-specific and does not grant L&F Owner access.
- **Emmaus sign-in and portability boundary (repository and schema-metadata review):** L&F requires an authenticated user, verified email, and `EMMAUS_SSO_SECRET`, then signs a short-lived (120-second) HMAC assertion. The Emmaus receiver validates signature, issuer, audience, and expiry, establishes an Emmaus session, and records the cross-product identity in protected `emmaus_identity_links`. Each product retains its own Auth user ID. The Emmaus schema has user-linked records for discovery/study progress, notes, bookmarks, highlights, saved journeys, guided-study responses, study records and completions, member path plans, memory cards, reading positions, text annotations, daily entries, member preferences, notification preferences/deliveries, push subscriptions, and user feedback. These include tables such as `emmaus_discovery_progress`, `emmaus_verse_notes`, `emmaus_verse_bookmarks`, `emmaus_verse_highlights`, `emmaus_saved_journeys`, `emmaus_guided_study_responses`, `emmaus_study_records`, `emmaus_path_completions`, `emmaus_member_path_plans`, `emmaus_memory_cards`, `emmaus_reading_positions`, `emmaus_text_annotations`, `emmaus_daily_entries`, `emmaus_member_preferences`, `emmaus_notification_preferences`, `emmaus_notification_deliveries`, `emmaus_push_subscriptions`, and `emmaus_user_feedback`. Some shared-authoring tables also contain `created_by`/`updated_by`; those require attribution/retention review and must not be deleted as personal rows if other members depend on the shared content. This was a metadata-only inventory: no Emmaus member records were read or changed. Before promising a complete export/removal, use the identity link to coordinate a server-side Emmaus export/delete operation, define what happens on partial failure, and keep shared study content intact. The sign-in handoff itself does not synchronize study progress.

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
- **Member directory versus admin roster (repository review):** no general member-directory route or field-sharing preference was found. The existing `/admin/users` page first requires an active effective admin, then uses a service-role query to load full names, emails, roles, active status, and join dates. Treat that as a restricted admin roster; do not reuse its service-role result for member search. The member directory needs a separate field-allowlisted query that applies member-selected sharing and audience rules at the database/API boundary.
- **Ministry memberships:** members may insert their own row only with `membership_role = member`, select their own rows, and delete their own rows. Admins can select, update, or delete membership rows. This is direct join/leave behavior, not a pending approval flow.
- **Study groups:** active participants and admins can read a group; admins manage group records. A member can read their own group-membership row, while facilitators and admins can read the group's roster. Admins manage membership rows; the reviewed policy set does not let facilitators change them.
- **Bible studies and progress:** members read published studies and published content; only admins manage Bible-study/catalog records. Ministry leaders can manage content for their ministry, while the reviewed published-ministry-content read policy allows any authenticated member to read published rows regardless of ministry slug. `content_progress` and `memory_verse_progress` are user-owned. Daily progress is limited to the user's unlocked day; daily responses are limited to unlocked own responses, with locked group responses visible under active-group, facilitator, and admin checks.
- **Study session visibility:** the `study_sessions` SELECT policy allows authenticated members to read session rows whenever the linked Bible study is published, and the row includes `group_id`, facilitator, and Google meeting URI/code fields. **Implementation implication:** this appears broader than the approved role/group-scoped calendar and may expose meeting details beyond intended participants. Confirm the intended audience and narrow the policy before exposing live session or meeting-link fields in the rebuilt member calendar. Session participant rows are limited to the participant and admins; admins manage them.
- **Facilitator supervision:** the assigned supervisor and facilitator can read their relationship; admins manage it. It remains narrower than general delegation.
- **Prayer requests:** signed-in members can insert their own requests only while active, select and update their own rows, and admins can select/update/delete through the current policy set. The current API requires sign-in. The live public/private and moderation columns cannot encode the approved visitor-only-public-after-clearance rule or a member-selected group/Prayer-team audience. The checked `set_prayer_request_defaults()` trigger only fills a care-level value; it does not change the public or moderation defaults. The preview's stricter flow is therefore a future requirement, not a claim about the existing application.
- **Preferences and notifications:** members can select, insert, and update only their own `user_settings`; the checked columns include email, reaction, giving-impact, campaign, and annual-report preferences, with existing defaults enabled. Members can read/update/delete their own notification rows and manage their own push-subscription records. `notifications` also contains delivery-state fields, so new settings must map to the existing channel behavior and preserve history.
- **Administrator boundary:** the checked policies rely on the existing admin role or helper. They do not encode the agreed Chad/Chrissy Owner-only ability to grant or remove admin access.

### Target audience rules for study sessions and calendars

This is the recommended access contract for the rebuild, derived from the approved role-scoped sharing model. It does not change current database permissions.

| Audience | Study material | Session schedule and join details |
| --- | --- | --- |
| Visitor | Public, published study overview only | No group roster, personal progress, or meeting link. |
| Signed-in member | Published studies and their own progress | Only sessions explicitly designated for all members or visible through an accepted group, role, assignment, or direct invitation. |
| Accepted group participant | Content shared with that group | Session details only when the session’s scope matches the active group membership. |
| Assigned facilitator or supervisor | The study and records needed for the assigned group/session | Only assigned session and permitted participant information; no cross-group access from a global role name alone. |
| Administrator | Operational study and session tools | Broad access for administration, with sensitive access changes and moderation auditable. |

Keep study publication separate from session disclosure. Treat meeting URLs, access codes, organizer email, rosters, and member responses as restricted fields. Because the current session row has a `group_id` but the reviewed policy does not use it, confirm whether an explicit audience field or invitation relation is needed before changing the policy. If a session has no explicit audience, do not expose its join details by default.
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
| Field-by-field profile sharing | `profiles` currently contains `full_name`, `avatar_url`, `email`, `phone`, `gender`, `faith_story`, `favorite_scripture`, `date_of_salvation`, and `date_of_baptism`, alongside role/status and internal ministry-availability fields. The current `/admin/users` route is an admin-only roster using a service-role query. | No per-field or per-audience sharing preferences or member-directory route were found. Do not reuse the admin roster for member search. Build a separate directory from an explicit allowlist; keep contact and faith-story details private unless the member shares them. Keep role, availability, rotation, assignment counts, and review flags out of public profiles; expose them only in authorized role workflows. The exact field list and sharing defaults still require specification. |
| Prayer intake and audience privacy | `public.prayer_requests` and the existing authenticated submission route | The live table has `user_id` nullable but only active signed-in members can insert through the current route/RLS. The stored audience is only `is_public`; no group or Prayer-team audience is represented. The live column defaults are public and approved, while the current defaults trigger only supplies care level. The product’s visitor-clearance flow and member-selected group/Prayer-team audiences are not implemented in this foundation. New intake must force visitor requests into a hidden pending state and preserve a member’s exact audience through moderation; verify the feed view and all write paths before any release. |
| Notification settings and push | `user_settings` has `email_notifications`, prayer/praise/testimony reaction toggles, giving-impact/campaign/annual-report email toggles, and `default_anonymous`. `notifications` stores in-app history plus `push_status`, attempt/delivery time, and error fields. `push_subscriptions` stores per-device endpoint keys and user agent. | Existing preference fields default enabled but do not represent every approved notification category/channel combination. Map categories explicitly, preserve user opt-outs and history, and retain per-user/per-device RLS. Push permission must be requested at sign-in and only create a subscription after both browser permission and member preference allow it. No paid delivery service is approved. |
| Studies and progress | `bible_studies`, `content_catalog`, `ministry_content`, `study_groups`, `study_sessions`, group/session participants, daily progress/responses, and member-specific content/memory-verse progress | Preserve study IDs, Scripture references, published content, group and session history. Keep progress private to its member and group responses limited to approved participants. Review/harden the current published-study session SELECT policy before using live meeting details: its present condition does not restrict by `group_id` or participant. Published ministry content is currently readable by all signed-in members; confirm this matches the ministry audience rules. |
| Calendars, events, and registration | The read-only public-schema inventory found no L&F calendar, event, or registration relations. The similarly named `rare_events` family belongs to Rare Network and is separate. | Treat L&F calendar/event data as a new scoped feature after code and integration inventory. Keep registration free. A master calendar aggregates only events the signed-in role is authorized to see; a member calendar shows personal, accepted-group, assigned, and explicitly shared events. Apply filters for category, ministry, role, assignment, and personal/master scope without broadening access. |
| Auditability | No general role, group-decision, or delegation audit table was found in reviewed migrations | Preserve history for role grants/removals, decisions, delegation changes, and prayer moderation with actor, scope, outcome, timestamp, and reason when supplied. Define retention before enabling real writes. |
| Member export and departure | Schema metadata identifies member-linked records across `profiles`, `user_settings`, `notifications`, `push_subscriptions`, `ministry_memberships`, prayer/praise/testimony, learning progress, study participation/responses, care applications, directory saves/submissions, ministry stories, marriage journey/couple records, feedback, and giving transactions/communications. | Build a row-level export/delete inventory using all user and relationship foreign keys, not just tables named `user_id`. Separate personal content from shared Bible studies/groups and operational records. Public/shared prayer, partner-linked marriage data, audit history, legacy care archives, and financial records need explicit retain/anonymize/remove rules before release. Never delete shared studies or records belonging to Rare Network, Emmaus, or Study Companion by broad table-name prefix. The L&F project and standalone Emmaus project both contain Emmaus-related schema objects; identify the authoritative source for each data type to avoid missed or duplicate handling. |

## Adult-only signup and initial access contract (proposal)

The approved product rules are adults only, immediate baseline membership after sign-up, and approval for every ministry or elevated role. The existing form requires full name, email, password, gender, and community-guidelines acknowledgement; phone is optional. Email confirmation remains required before an authenticated app session, while the Auth trigger creates the baseline `member` profile at account creation.

| Field / step | Requirement | Intended use and privacy |
| --- | --- | --- |
| Full name, email, password | Required | Create and secure the account. Email verification remains required before app access. |
| 18+ affirmation | Required | Member confirms they are at least 18. Store the affirmation timestamp and policy version. This is self-attestation, not identity-verified age assurance. |
| Date of birth | Optional | If provided, validate adult eligibility and derive broad age-band analytics. Do not display it in the directory or general admin roster. Keep raw DOB out of analytics reports and expose it only to the member and the restricted eligibility service. |
| Gender | Optional recommendation | The current form requires it. Make it optional unless a specific approved ministry workflow requires it; never use it as a general eligibility or access condition. |
| Phone | Optional | Account/contact use only; never directory-visible unless the member separately shares it. |
| Ministry interests | Optional | Help members find relevant studies and ministries; also support aggregate program planning. Do not assign roles automatically. |
| How they heard about L&F | Optional | Aggregate referral-source reporting. |
| General region (state or broad area) | Optional | High-level service planning only; do not request a street address or precise location for analytics. |
| Community-guidelines acknowledgement and CAPTCHA | Required | Preserve existing moderation expectations and CAPTCHA verification. |

Make optional profile and analytics fields explicitly skippable; collect them on signup only if they do not make account creation burdensome, otherwise offer a later “Complete your profile” step. Optional answers do not affect membership, role approval, access, or service. Clearly label why each field is requested. Analytics use aggregate reports with small groups suppressed; never turn profile data into member scores, eligibility rankings, or public profile fields. Analytics consent is separate from directory sharing, and each shared profile field remains under the member’s control.

If DOB is provided and indicates the person is under 18, do not create the account or retain the submitted DOB from the rejected attempt. If omitted, the required 18+ affirmation is the eligibility gate. For visitor prayer, use the required 18+ affirmation and public-after-moderation acknowledgement; do not request or retain a visitor’s DOB or create an account just to submit prayer.

Enforce the required age affirmation across account-creation paths, including Emmaus entry points and direct Auth API access; a visible checkbox alone is not a complete enforcement boundary. Preserve the current safe redirect, duplicate-account handling, email confirmation, and CAPTCHA behavior. Never infer an elevated role from signup answers or user-editable metadata.

Before release, define privacy notice text, field retention/update rules, policy versioning, minimum analytics cohort size, existing-account treatment, and what happens if an existing member later reports an under-18 DOB. No paid verification provider is proposed. No live signup behavior is changed by this section.

## Calendar and event implementation contract (proposal)

The product direction is approved: provide a master admin calendar and personal member calendars, with category, ministry, role, and assignment filters; events remain free. No L&F calendar/event tables exist yet, so use a small first-party schema rather than adding a paid calendar service.

| Record | Purpose | Key fields / constraints |
| --- | --- | --- |
| `ministry_events` | One event or gathering; calendar views are derived from this record and the viewer’s authorization. | Title, description, category, start/end timestamps, IANA time zone, location or meeting-link reference, draft/published/cancelled state, creator/updater, optional registration limit, and registration open/closed. No price or payment fields. |
| `event_audience_rules` | Define who may see event details. | Event, audience kind (`all_members`, `ministry_role`, `group`, or `assigned_members`), and the matching scope ID. A meeting URL or private location uses the same or stricter audience as the event. |
| `event_assignments` | Identify members assigned to serve or prepare for an event. | Event, member, assignment label/role, assigning actor, status, and timestamps. Assignment grants visibility to that event only; it does not grant a ministry role or access to unrelated admin functions. |
| `event_registrations` | Record a member’s free registration. | Event, member, registered/cancelled/waitlisted status where capacity requires it, timestamps, and a unique event/member pair. Enforce capacity atomically on the server to prevent overbooking. |

**Calendar behavior:** the master view is an authorized aggregation, not a bypass. A member’s calendar is a personalized query of personal, accepted-group, approved-role, assigned, and explicitly shared events. Filters only narrow that result set; they never grant visibility. Use the event’s saved time zone for display and preserve the underlying absolute timestamps. Recurring event series and external calendar subscriptions are outside the initial schema until specified.

**Privacy and administration:** enforce event audience rules in server queries and RLS, not only in UI. Keep attendee names/contact details out of general calendar and registration summaries; proposed default is that only the member and authorized event managers can see a registration identity, while other members see capacity/remaining-space counts. Do not expose join links or private locations through broad published-study policies. Audit event creation, audience changes, assignment changes, cancellation, and registration overrides with actor, scope, and time.

**Release gates:** confirm whether events may appear on the public homepage, whether any attendee list is needed for event managers, waitlist behavior, recurrence, cancellation notice channels, and whether members may create personal calendar entries. Do not implement external calendar sync or a paid calendar integration by default. This section is a design contract proposal, not a schema migration or authorization to change Production.

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
### Resource-level access acceptance matrix

These are required authorization outcomes for later implementation and security verification. They are not evidence that the current Production policies already meet them.

| Resource/action | Visitor | Member | Scoped role or assignment | Administrator | Owner |
| --- | --- | --- | --- | --- | --- |
| Member profile/directory | No access | Own profile; other member fields only when explicitly shared to an allowed signed-in audience | Only needed fields within approved scope | Limited to an authorized operational purpose | Same member-data boundary unless an Owner action requires it |
| Prayer request | Submit visitor request; pending item stays hidden | Own request and selected audience; cleared public items only | Assigned care item only, with minimum necessary details | Moderate/assign within approved role; cannot broaden member audience | Administrative oversight with moderation audit |
| Group and roster | No access | Own membership and details for accepted groups | Exact assigned group; roster access must be separately granted | Manage membership/workflows | Administrative authority; sensitive changes audited |
| Bible study and session | Public published overview | Published study material and own progress; session details only when all-member scope is explicit | Assigned group/session details; no other group’s join URL or responses | Manage scheduled sessions and study content | Administrative authority |
| Calendar/event | Public event summary only | Personal calendar plus matching group, registration, assignment, and explicit shares | Events in exact ministry, group, role, or assignment scope | Master calendar within authorized admin duties | Administrative oversight |
| Notification/settings | None | Own notification preferences, subscriptions, and history | Send only for authorized workflow; never read another person’s settings | Manage approved campaigns, not personal preference rows | Owner controls only for Owner actions |
| Role grant/removal | None | Submit own request; no self-approval | Review only exact decision type/scope while active; never grant admin | Cannot grant/remove administrator | Chad and Chrissy only, server-verified and audited |
| Export/removal | None | Request/export/remove own data with clear retention disclosures | No access except explicitly delegated support steps | Process only authorized support action | Oversight subject to audit; never bypass member confirmation |

**Verification rule:** for each row, test both the permitted path and a near-miss denial (wrong group, expired delegation, unshared profile field, pending prayer request, unassigned work, or non-Owner admin change).



## Proposed profile and notification settings details

These recommendations translate the approved member-control decisions into screen behavior. They remain proposals where the exact audience, field defaults, or channel behavior has not been approved.

### Profile sharing

| Setting | Proposed behavior | Privacy boundary |
| --- | --- | --- |
| Directory listing | One clear control to appear in the signed-in member directory; off until the member chooses to share. | A member can hide their entire profile from directory search without losing account access or group participation. |
| Name and photo | Separate member-controlled visibility switches. | Visible only to the selected signed-in audience; no public profile page in the initial release. |
| Contact details | Separate email and phone switches with audience selection. | Private unless shared; allow sharing with a selected accepted group or the signed-in L&F member directory. Never expose contact fields through public feeds. |
| Faith story and Scripture | Separate switches for faith story, favorite Scripture, and faith milestones (salvation/baptism dates). | Private unless the member selects a signed-in audience; do not show operational role or availability fields in the directory. |
| Gender and internal fields | Do not include gender, account status, ministry availability, rotation state, assignment counts, or review flags in the general directory. | These fields remain private or limited to explicitly authorized operational workflows. |

**Recommended default:** keep the directory listing and every shareable field private until the member opts in. Let members review the exact audience before saving. Keep the ability to hide the whole profile independent from field-level choices. This default is a proposal and should be confirmed before implementation.

### Notification categories and push

The existing settings screen supports reaction toggles for prayer, praise, and testimony; a community email toggle; giving-impact, campaign, and annual-report email preferences; and a separate device-level push subscription. The new settings should retain those choices and add missing product categories without overwriting explicit preferences.

| Proposed category | Examples | Existing foundation |
| --- | --- | --- |
| Access and approvals | Role/group request decisions, invitations, and access changes | No general approval-notification preference or request tables found. |
| Prayer and care | Updates to a member’s own prayer request, private care follow-up, and prayer activity reactions | Prayer reaction preference exists; care routes and user-owned notifications exist. |
| Studies and groups | Study-session changes, group invitations, daily-path reminders, and assigned study work | Study notifications and progress exist; no group-level notification preference. |
| Events and calendar | Registration confirmation, event changes/cancellation, and optional reminders | No L&F event/registration tables found in the live schema inventory. |
| Assigned ministry work | New assignment, due-date reminder, reassignment, or completion request | Assignment notifications exist; legacy prayer-care email routes have been retired. |
| Encouragement | Prayer, praise-report, and testimony reactions | Separate existing in-app reaction toggles. |
| L&F updates and giving | Ministry impact, campaign notices, and annual giving report availability | Existing email toggles are available. |

**Recommended behavior:** enable all notification categories for newly created preferences, then allow a member to turn off any category. Do not reset a member’s existing explicit choices during migration. Keep in-app history available; preference controls govern future delivery. Push is a per-device channel: show the requested opt-in prompt after successful sign-in, ask the browser permission only after the member taps Enable, and allow push only when browser permission and the category preference both allow it. If the member dismisses or denies the browser prompt, keep in-app notices available and explain how to turn push on later in Settings. On iPhone/iPad, explain the Home Screen installation requirement before asking for push permission.

**Channel question still open:** the current data model combines some in-app categories and email settings, while push uses a device subscription. Decide whether members need one category-level switch across all channels or separate in-app, push, and email switches per category. Keep required account/security notices clearly identified if they cannot be turned off.

## Rebuild readiness checkpoint

Use this checkpoint to separate approved experience decisions from work that must be complete before connecting real member data.

| Area | Current status | Gate before live integration |
| --- | --- | --- |
| Visual direction and navigation | The sample preview reflects the accepted flat-color admin direction, overview, member home, public home, responsive layout, and accessible help patterns. | Continue synthetic UI refinement; review small-screen completion interactions before release. |
| Membership and roles | Auth creation triggers a baseline member profile; current sign-up requires email confirmation before app access. Additional roles require approval, and Owners alone can grant/remove admins. | Keep the verification step, finalize role/reviewer mapping and stable Owner IDs, review required gender collection, then implement server-side checks, audit, and RLS. |
| Calendars and events | Master/personal calendars, filters, role/assignment sharing, free registration, and the UI concept are agreed. | Define L&F event/audience records; resolve the current study-session join-link visibility issue before using live schedules. |
| Prayer | Visitor requests are public only after clearance; member requests use a member-selected audience. | Build visitor intake, pending moderation, group/Prayer-team audience storage, and feed/count safeguards across every route and policy. |
| Profiles and directory | Members control sharing field by field. | Specify per-field audience defaults and implement allowlisted reads and field-safe updates. |
| Notifications and push | Categories start enabled; members can opt out individually; request push permission at sign-in. | Map exact categories/channels, permission-denied handling, and preference storage to existing delivery routes. |
| Studies and groups | Preserve existing Bible study content, group history, and member progress. | Confirm study-session audience rules; restrict meeting links and responses to the approved group, role, assignment, or invitation. |
| Emmaus | Signed-in handoff and identity-link behavior are confirmed; study/progress sync is not approved. | Identify authoritative data source per feature and coordinate export/removal with Emmaus through a server-side flow. |
| Data export and departure | Portable export plus removal of personal L&F and connected Emmaus data is approved. | Complete table-by-table export/delete/retain/anonymize rules, including financial, shared, partner-linked, public, and audit records; define partial-failure recovery. |
| Adult eligibility | Adults-only initial release is approved. | Approve the proposed age-confirmation approach or specify stronger age assurance and data retention. |
| Cost | No member payment and no new paid service without a cost review. | Keep the design within current services; review any new recurring cost before adding it. |

**Build recommendation:** the synthetic front end can continue to be refined against the approved layout and workflows. Keep live reads/writes, permission migrations, and account deletion behind the gates above; the preview is not a substitute for those controls.

## Core workflows

### Sign-up and access

1. Before account creation, require the adult-eligibility confirmation if the proposed gate is approved. Then create the Auth account; the profile trigger provisions baseline `member` access without a ministry-role approval.
2. Require email confirmation before granting an authenticated app session, consistent with the existing sign-up flow; after confirmation, route the member to their personal home.
3. Ask for profile and directory sharing choices separately; use only the sharing defaults approved for release.
4. Explain how group participation and ministry roles differ.
5. Route additional role requests to a reviewer authorized for the exact role and scope. Prevent self-approval and show request state/outcome to the requester.

### Role and group approvals

1. The reviewer sees the requester, requested role or group, exact scope, training/evidence when applicable, and their authority boundary.
2. Before a decision, show the exact outcome. Require confirmation that the reviewer is authorized and is not approving their own request.
3. An optional decline reason is returned to the requester through an approved notification channel.
4. A group decision changes group participation only. A role decision changes only that approved role and scope.
5. A delegated decision is constrained by its recorded end date; expiration removes decision authority automatically.
### Approval and invitation record contract (planning proposal; not a migration)

Keep these workflows as separate records so approving one kind of access cannot silently grant another:

| Record | Minimum information | Suggested lifecycle |
| --- | --- | --- |
| Role request | Requester, exact role, ministry/group scope, submitted time, current status, reviewer/decision, optional reason, and a protected evidence reference when required. | `pending` → `approved`, `declined`, `withdrawn`, or `expired`; `needs_information` may return to `pending`. |
| Group join request | Requester, exact group, submitted time, status, reviewer/decision, and optional reason. | Separate from role requests; acceptance grants group participation only. |
| Group invitation | Inviter, invited member, exact group, sent time, expiry, response, and revocation state. | `pending` → `accepted`, `declined`, `expired`, or `revoked`. |
| Delegation grant | Grantor, delegate, decision types, exact role/group scope, start/end time, revocation time, and reason if supplied. | `scheduled` → `active` → `expired` or `revoked`; authority stops at end/revocation. |
| Decision audit entry | Actor, requester/subject, decision type, exact scope, outcome, timestamp, and optional reason, linked to the request/delegation. | Append-only history; corrections create another entry rather than erasing the original decision. |

Only the directly authorized reviewer or a currently active, matching delegation may decide a request. Block self-approval, scope expansion, onward delegation, and administrator grants/removals by delegates. Keep submitted evidence out of general directory and group views. Exact role names, evidence rules, reviewer mapping, delegation duration, and retention remain open specifications.

### Prayer moderation

1. Keep visitor requests hidden from public pages while pending.
2. Before clearing a visitor request, identify the content that becomes public and require explicit acknowledgement of that audience.
3. For a member request, preserve the audience chosen by the member through moderation and publication.
4. Keep private member requests out of public feeds and public-facing counts that could reveal them.
5. Keep prayer activity repeatable; do not use public leaderboards or popularity rankings.

### Prayer intake and audience contract (proposal)

The approved boundary is: visitors may submit public prayer requests without a member account, and a visitor request is invisible on public surfaces until an authorized moderator clears it; once cleared, it is public. A member may choose a private audience. The current `is_public` flag cannot represent the approved audiences and must not be reused as a substitute for explicit moderation state.

| Request type | Required persisted state | Visibility rule |
| --- | --- | --- |
| Visitor | `user_id = null`, visitor submission marker, `audience = public`, `moderation_status = pending`, public-sharing acknowledgement timestamp. | Hidden from feeds, search, previews, counts, and notifications until an authorized reviewer clears it. Clearance makes it public; reviewers cannot republish it under another audience. |
| Member, public audience | Authenticated `user_id`, `audience = public`, member acknowledgement timestamp, moderation state. | Public only after the member’s audience choice and any required clearance are satisfied. |
| Member, prayer team | Authenticated `user_id`, `audience = prayer_team`, moderation state. | Visible only to the requester and currently authorized Prayer-team members. Never included in public feeds/counts. |
| Member, accepted group | Authenticated `user_id`, exact `group_id`, moderation state. | Visible only to the requester and authorized members of that accepted group. Membership is checked at read time; leaving the group revokes visibility. Never included in public feeds/counts. |

Keep the schema model explicit (for example, `audience_kind`, nullable `group_id`, and `moderation_status`) and enforce valid combinations server-side: visitors cannot choose private audiences; a member’s group audience requires current accepted membership; only public-audience requests can enter public feeds; moderation can clear or decline but cannot widen the member’s chosen audience. Treat the public acknowledgement as a required recorded event before public clearance. Do not collect a visitor’s identity/contact information unless a separately specified feature requires it.

Provide separate creation/read routes and RLS for visitor intake, member submission, public feed, Prayer-team care, group requests, and moderation. Public counts must query only cleared public items; private request existence and reactions must not leak through totals or notifications. Keep prayer engagement supportive and repeatable: no popularity ranking, public leaderboard, or private-request count in public aggregates.

Open implementation details: whether a member’s Prayer-team/group request requires moderator approval before its chosen audience can see it; field-level anonymity options; retention periods; abuse throttling/CAPTCHA approach; and whether visitors can edit or withdraw without an account. These are not settled by the public-after-clearance rule. No change to live behavior is approved by this proposal; implement only after a complete feed/RLS/write-path audit.

### Notification delivery and push contract (proposal)

The approved preference rule is that notification categories start enabled and members can opt out individually. Keep that choice separate from the device’s browser permission and from required account-security messages.

| Notification category | Example | Default |
| --- | --- | --- |
| Prayer care and updates | A response or authorized care update for the member’s own request | On |
| Prayer, praise, and testimony encouragement | A member reacts to the member’s content | On |
| Group and ministry updates | Announcements for accepted groups or approved ministry roles | On |
| Roles and group access | Request decisions, invitations, and expiring access reminders | On |
| Events and registrations | Registration confirmation, schedule/location change, cancellation | On |
| Assigned work and studies | A task assigned to the member or a study/session update within their scope | On |
| Account and security | Email confirmation, password reset, security or essential service notices | Required; not controlled by ministry-notification opt-outs |

Store choices per category and channel (in-app, email, push) so a member can turn off one kind of message without losing other useful updates. New categories default on when no preference exists; migration must preserve every explicit existing opt-out. Any global email preference must be reconciled with these category choices without silently turning a member back on.

**Push prompt:** after sign-in, show an in-app invitation on a device that has not been opted into push. “Enable” is a user gesture that then invokes the browser permission prompt and creates a per-device subscription only if permission is granted and the relevant push preferences are enabled. “Not now” leaves the account and in-app/email preferences unchanged. If browser permission was denied, stop showing the native prompt; explain that device permission must be changed in browser settings and keep the in-app/email options available. Provide per-device unsubscribe and account-wide category controls.

**Privacy and delivery:** check the member’s current audience/role/assignment before creating a notification, and recheck it before delivering delayed work. Never include private prayer text, care notes, meeting links, or sensitive details in lock-screen previews or email subject lines; use a neutral summary and require sign-in for details. Keep delivery logs limited to operational status and short error codes, not private message bodies. Do not reset stored notification history or create duplicate subscriptions when a member signs in again. Use existing delivery infrastructure; no paid notification provider is approved.

Confirm the final category list, quiet-hour behavior, and how repeated “Not now” prompts should be paced before implementation. This is a design proposal, not a change to current notification delivery.

### Data portability and departure

1. Let a member request a complete personal export in a readable, portable format.
2. Include their profile, preferences, authored content, prayer activity, group and event history, study activity, and connected Emmaus data that L&F can provide.
3. Explain what account removal deletes and what shared content other people may still need to see.
4. Delete the member’s L&F and connected Emmaus personal data after confirmation, subject to the retention policy established before release.
5. Provide a completion receipt without retaining a copy of the exported personal data.
### Existing account controls reviewed

The current Settings page covers notification preferences, a default-anonymous prayer setting, push setup, profile navigation, and feedback. It does not currently offer a personal-data export or a member-facing account-removal flow.

The existing `POST /api/account/delete-self` route deletes the signed-in user from Supabase Auth directly. It blocks deletion when that account is the last profile with the ordinary `admin` role, but it does not create a durable request, show a reviewable retention summary, revoke device push subscriptions explicitly, export data, or coordinate deletion with Emmaus. Treat it as an incomplete legacy control; do not carry it into the rebuild as the approved departure workflow. The admin user-delete endpoint is also not a substitute for a member portability workflow.

The separate Emmaus project has an MFA-protected administrator deletion action requiring the target email as confirmation and blocking owner/founder accounts. A read-only live-schema foreign-key review confirms that deletion of an Emmaus Auth user cascades through the mapped member-owned data, including preferences, study progress/responses, notes, highlights, bookmarks, reading positions, path plans/completions, feedback, notification preferences/deliveries, push subscriptions, and the Emmaus-side identity-link row. Notification deliveries also cascade when their push subscription is removed. The Emmaus identity-link row is keyed to the Emmaus Auth user; its L&F user ID is not an Auth foreign key, so deleting the L&F account alone will not cascade into Emmaus. Cross-product deletion therefore still requires a server-side identity lookup and explicit Emmaus deletion call.

The same schema review found an important shared-content gate: deleting an account can be blocked by authored-content references. Emmaus study paths retain `created_by` and `updated_by` with NO ACTION behavior; study units retain creator/publisher/approver/updater references with NO ACTION; notification campaigns restrict deletion of their creator. Other editorial attribution fields use SET NULL. Before removing a content-author or administrator account, preserve shared content and define an authorized attribution transfer or other approved retention treatment. Do not delete shared studies as a side effect of account removal.

This was metadata-only review of foreign-key definitions; no member row values were read and no database changes were made. The admin endpoint remains an existing building block, not member self-service or a complete cross-app workflow. The rebuild still needs a durable request state, explicit cross-app call/verification, a policy for attributed shared content, and a completion receipt that reports any retained attribution or records.

### Live L&F deletion-boundary review

A read-only query of live foreign-key metadata in the L&F Supabase project confirms the current Auth deletion has several distinct effects:

- **Member-owned records that cascade:** profile, user settings, push subscriptions, prayer reactions/notifications, group and ministry membership, study and learning progress, and member-owned Emmaus Companion records in the shared L&F database.
- **Shared records that remain with author references cleared:** prayer requests, praise reports, testimonies, feedback, Bible studies, ministry content, sessions, and multiple content/audit attribution fields use `SET NULL` for some user references. The departure notice must explain when shared content remains but is no longer attributed.
- **Records that may block deletion:** live constraints use `NO ACTION` or `RESTRICT` for some giving transactions/communications, couple records and assignments, ministry stories, directory entries/partnerships/moderation, devotion weeks, Emmaus discovery paths and Scripture imports/nodes, impact/compliance records, and other authored or verified records. Whether each can be safely anonymized or reassigned depends on its nullability, retention duties, and ownership; do not delete or rewrite these records automatically.
- **Separate Rare Network family:** the same L&F Auth user is referenced by Rare Network tables with cascade behavior for memberships, profiles, preferences, prayer, groups, content, events, and progress. The approved L&F departure scope names L&F and connected Emmaus data. Because the current shared Auth deletion can also erase Rare Network records, the rebuild must establish the account-boundary/consent behavior across products before any live deletion path is enabled.

This metadata review read no member row values and changed no database objects. Directly deleting the Auth user is not a complete or safe workflow by itself: preflight all blocking references; preserve records with financial, shared, partner, or audit value; clarify the Rare Network consequence; and report any retained/anonymized categories. Validate these outcomes with synthetic identities in isolated staging before launch.

### Proposed export and departure experience

Keep two distinct Settings actions: **Download my information** and **Delete my account**. Each action explains what it does before the member confirms.

**Export proposal:** generate a downloadable package containing a human-readable index plus machine-readable JSON/CSV for the member’s profile, preferences, authored prayer/praise/testimony, group and ministry memberships, study progress/responses, calendar/registration records when built, and Emmaus records available through the verified identity link. Include the member’s own uploads when present. Do not include another person’s private fields, private care notes, moderator-only content, shared content that the member does not own, or data from Rare Network/Study Companion. Show a list of included and excluded data categories before download.

Protect the package with a recent sign-in check and an authenticated, short-lived download. Do not email the archive as an attachment or retain a permanent copy. Use existing storage only if it supports a short expiry and deletion; otherwise generate the download on demand. Confirm format and delivery details before implementation.

**Deletion proposal:** require a fresh confirmation, explain what may be retained or remain visible as shared content, then revoke sessions and device push subscriptions and coordinate deletion of L&F personal records with Emmaus through a server-to-server operation. Keep a request status such as `requested`, `processing`, `completed`, or `needs_attention`; do not mark the request complete until both product systems confirm their work and any retained categories are disclosed. Retry operations idempotently so a partial failure can resume without duplicating actions. Preserve shared Bible studies and other members’ records; handle authored public/shared items through the retention decision rather than deleting whole shared records.

Export format, link lifetime, re-authentication method, retention exceptions, timing, and treatment of shared content remain open decisions. Do not enable either action against real accounts until the full table/foreign-key inventory, Emmaus service contract, retention policy, and recovery procedure are reviewed.

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

- Account creation immediately provisions the baseline L&F member profile; consistent with the current sign-up flow, the member enters the authenticated app after confirming email. Every ministry or elevated role still requires approval.
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

### Recommended starting choices for unresolved details

These recommendations are offered to make the next product review concrete. They remain proposals; do not encode them as approved ministry policy until accepted.

| Open detail | Recommended starting choice | Reason / boundary |
| --- | --- | --- |
| Reviewer assignment | Assign named reviewer roles by request type and ministry/group scope. Existing admins may handle only explicitly delegated non-admin decisions; only Chad and Chrissy may grant or remove admin access. | Avoid a blanket assumption that every admin can approve every role. |
| Delegation term | Use a 30-day default term, a proposed 90-day maximum, explicit start/end times, revocation at any time, and renewal as a new grant. | Short, auditable grants reduce stale authority; the exact durations remain a ministry decision. |
| Profile directory defaults | Directory off and every optional field private until the member opts in; no public profile in the initial release. | Matches member-controlled sharing and reduces accidental disclosure. |
| Adult eligibility | Require an 18+ confirmation before account creation and visitor prayer submission; do not collect full date of birth by default. | Low-data eligibility gate; it is not identity-verified age assurance. |
| Notification controls | Start new categories enabled; let members opt out by category and channel; preserve existing explicit choices; ask for device push permission only after sign-in and member action. | Fits the approved all-on default while respecting browser permission and channel preferences. |
| Export package | Provide a ZIP containing a human-readable index plus JSON/CSV data, with an authenticated short-lived download. | Gives the member a readable copy and portable structured data without keeping a permanent archive. |
| Retention after departure | Do not invent a blanket retention period. Set a documented schedule before release; preserve only records that policy requires, and explain each retained category in the completion receipt. | Financial, safety, audit, shared, and partner-linked data need different treatment. |

These implementation details are not permission to change Production. The rebuild preview remains synthetic and sample-only until data, permission, privacy, migration, and rollback plans are reviewed.
