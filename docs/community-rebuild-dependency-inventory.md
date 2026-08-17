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
