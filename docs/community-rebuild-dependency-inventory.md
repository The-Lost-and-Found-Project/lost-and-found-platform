# Community App Rebuild Dependency Inventory

Status: Phase 1 inventory. No production data has been deleted.

## Preserve

- `profiles`, authentication users, settings, and account history
- `prayer_requests`, `prayer_reactions`, categories, moderation state, and prayer counts
- `praise_reports` and their links to prayer requests
- `testimonies`, moderation state, and public views
- `notifications`, push subscriptions, delivery records, and preferences
- public Home, Prayer, Praise, Testimonies, Notifications, Profile, Settings, Support, Giving, and admin moderation

## Products moving out of this app

The following routes and data remain intact while migration destinations are decided. Phase 1 removes them from the Community Member primary navigation and Home page only.

- Emmaus routes, APIs, tables, progress, Scripture graph, and founder tools
- Bible Trivia routes, questions, categories, and attempt history
- Devotion routes, content, listening progress, and audio assets
- Study Companion routes, memberships, and feature settings

## Legacy Prayer Care architecture inventory

Do not drop these objects until every trigger, notification, cron job, admin action, and historical data consumer has a replacement or archival plan:

- assignment columns on `prayer_requests`
- care roles and availability fields on `profiles`
- `prayer_care_applications` and `care_team_rotation`
- assignment, reassignment, sabbatical, reinstatement, and stale-assignment routes
- assignment and follow-up database triggers/functions
- assignment notifications and weekly-digest sections
- `/prayer-assignments`, `/prayer-care-application`, and old Prayer Journey/member help language

Production inventory before Phase 2:

- 9 prayer requests have a legacy `assigned_to` owner
- 6 profiles have the legacy `prayer_team` role
- 1 historical Prayer Care application remains
- automatic assignment runs from `assign_next_care_team_member_trigger`
- assignment notices run from two database triggers plus email routes
- stale-assignment, reinstatement, sabbatical, availability, and reassignment paths remain in code

Phase 2 protection plan:

- copy every live assignment into private `legacy_prayer_care_assignments` before clearing ownership
- copy every former Prayer Care profile into private `legacy_prayer_care_members` before converting the role to `member`
- retain original assignment, rotation, application, and journey tables/columns for rollback and future export
- disable assignment triggers and function execution without dropping the legacy functions
- redirect old member pages, return HTTP 410 from old mutation endpoints, and replace My Journey with My Prayer Requests
- keep in-app notification history while moving active prayer links to `/prayer` or `/prayer/my-requests`
- remove stale-assignment, devotion-publishing, and legacy weekly-digest schedules to avoid unnecessary recurring invocations and email usage

## Phase 1 completed

- Focused Community Member navigation: Home, Prayer, Praise, Testimonies, Notifications
- Home no longer links to Emmaus, Trivia, Devotions, Grow, Prayer Assignments, or Prayer Care applications
- Account menu no longer exposes Prayer Assignments
- Prayer submission no longer asks assignment-related follow-up or care-team-gender questions
- Prayer Journey link and member-facing assignment language removed from the submission confirmation
- Existing data and legacy routes remain available for controlled migration and rollback

## Phase 2 verified locally and against production schema

- Production migration dry run completed inside a transaction and rolled back
- Dry-run assertions confirmed 9 assignment archives, 6 former-role archives, zero remaining live assignments, zero remaining `prayer_team` roles, and removal of automatic assignment triggers
- Post-rollback verification confirmed production remained unchanged: 9 live legacy assignments, 6 legacy Prayer Care profiles, assignment trigger present, and no archive tables created
- TypeScript, 71 application tests, ESLint with no errors, and the full Next.js production build pass
- No paid Supabase branch was created; the real-schema rollback test was used to conserve donated funds

## Phase 3 production inventory

The standalone products remain in the same Supabase project until their destination apps are provisioned. Phase 3 retires Community App routes and APIs without dropping tables, revoking future-app data access, deleting Storage objects, or copying data into paid infrastructure.

- Emmaus: 34 product-named tables, 2 views, 38 product-named functions, 31,102 Scripture nodes, 32,486 graph nodes, 64,354 graph edges, and 2 discovery progress records
- Bible Trivia: 11 categories, 550 questions, and 14 quiz attempts
- Devotions: 11 devotional weeks, 21 audio records, and 21 audio objects in the `devotion-audio` bucket
- Notifications: 2 historical `devotion_week_review` notices linked to `/admin/devotions`

Phase 3 separation boundary:

- redirect former product pages to `/programs#separate-products`
- return HTTP 410 from former product APIs before authentication or database work
- remove Grow and founder/admin entry points from the Community App
- preserve product source modules in place until destination repositories are approved
- preserve every database row, policy, function, view, and Storage object for extraction
- preserve EMAS functions while revoking anonymous and Community Member RPC execution; retain trusted `service_role` execution for extraction and future server use
- migrate only historical notification destinations; do not delete notification history

## Phase 4 production security and local shared ticker

- The three public feeds previously ran as privileged views because the base
  tables correctly deny anonymous reads. A blind `security_invoker = true`
  change would have emptied the public feeds.
- Production now keeps the approved-field projections in the unexposed
  `community_feed_private` schema and exposes only security-invoker wrappers.
- Anonymous and authenticated verification both return the unchanged live
  counts: 9 prayers, 3 praises, and 1 testimony.
- Anonymous users still have no base-table SELECT privilege on prayer requests,
  praise reports, testimonies, or profiles, and anonymous author-name leak
  checks return zero.
- All three high-severity security-definer-view advisor findings are cleared.
- The missed legacy `attach_john_1_semantics(text)` Emmaus writer is preserved
  for `service_role` extraction and no longer executable by anonymous or signed-
  in Community Members.
- A production verification caught six RLS policies that still invoked the
  revoked `is_care_team()` helper. No profile data was missing, but those stale
  dependencies returned 403 responses for signed-in profile and prayer reads.
  They now use a Community Admin-only helper; members can read their own rows,
  admins retain moderation access, and former Prayer Care roles gain no access.
- Locally, Prayer, Praise, and Testimonies now share compact two-line preview
  cards and a scrollable mobile-sheet/desktop-dialog full view.
- Prayer activity remains repeatable and Praise Love remains unique and
  removable inside the full view.
- The full Testimonies page loads once instead of polling. Lightweight Home
  previews poll at most once per minute to reduce database requests.
- Local TypeScript, 76 application tests, and focused lint checks pass. A full
  production build reached the external Google Fonts request and stopped only
  because this environment could not reach that host.

## Phase 5 no-prayer-left-behind distribution

- Active public requests are ordered first by the least prayer activity and
  then oldest first, so an under-supported request moves forward without an
  assignment queue or scheduled background job.
- Resolved, closed, and withdrawn requests no longer compete for space in the
  active Prayer page or Home prayer ticker. They remain preserved in member and
  administrative history.
- Public cards use pastoral support language instead of exact prayer totals.
  Exact counts remain available to the requester and administrators for care
  oversight and internal analytics.
- The admin Attention view and summary now identify approved public requests
  with zero or one prayer action as needing exposure.
- This phase adds no database table, migration, cron schedule, paid service, or
  additional page-load query.
- Local TypeScript, 77 application tests, focused lint, and whitespace checks
  pass.

## Phase 6 unified community tickers

- Prayer, Praise, and Testimonies use the same two-line preview, vertical ticker,
  and expanded-detail pattern.
- The full Prayer, Praise, and Testimonies pages reuse their ticker components
  in `showAll` mode instead of maintaining duplicate feed implementations.
- Prayer remains repeatable, while Praise Love remains unique and removable.
- The public welcome page and signed-in Home page now center the three live
  community experiences and no longer promote the retired Prayer Care team.
- Each ticker loads once per page visit. No polling, cron job, new table,
  migration, or paid service was added, avoiding recurring database reads as
  community traffic grows.
