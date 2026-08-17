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

## Legacy Prayer Care architecture pending safe retirement

Do not drop these objects until every trigger, notification, cron job, admin action, and historical data consumer has a replacement or archival plan:

- assignment columns on `prayer_requests`
- care roles and availability fields on `profiles`
- `prayer_care_applications` and `care_team_rotation`
- assignment, reassignment, sabbatical, reinstatement, and stale-assignment routes
- assignment and follow-up database triggers/functions
- assignment notifications and weekly-digest sections
- `/prayer-assignments`, `/prayer-care-application`, and old Prayer Journey/member help language

## Phase 1 completed

- Focused Community Member navigation: Home, Prayer, Praise, Testimonies, Notifications
- Home no longer links to Emmaus, Trivia, Devotions, Grow, Prayer Assignments, or Prayer Care applications
- Account menu no longer exposes Prayer Assignments
- Prayer submission no longer asks assignment-related follow-up or care-team-gender questions
- Prayer Journey link and member-facing assignment language removed from the submission confirmation
- Existing data and legacy routes remain available for controlled migration and rollback
