# First-pass legacy role consumer inventory

This is a source-search inventory, not a complete authorization audit. It records the working tree at commit `23198c55d2da2e3e9eb6894050e5a937f16837df` on November 16, 2026. Search patterns targeted profile role reads, SQL policies that inspect `profiles.role`, and direct role comparisons. Indirect checks, helper calls, RPCs, generated SQL, and nonstandard formatting may be missed. Each result must be inspected and classified before it is changed.

## Application files matching the first-pass search (51)

### Administration pages and actions (11)

- `app/admin/analytics/page.tsx`
- `app/admin/creator/page.tsx`
- `app/admin/library/actions.ts`
- `app/admin/library/page.tsx`
- `app/admin/live/page.tsx`
- `app/admin/notifications/actions.ts`
- `app/admin/notifications/page.tsx`
- `app/admin/page.tsx`
- `app/admin/studies/actions.ts`
- `app/admin/studies/page.tsx`
- `app/admin/users/page.tsx`

### Account and administration APIs (8)

- `app/api/account/delete-self/route.ts`
- `app/api/admin/community-content/moderate/route.ts`
- `app/api/admin/giving/zeffy-sync/route.ts`
- `app/api/admin/users/delete/route.ts`
- `app/api/admin/users/set-active/route.ts`
- `app/api/admin/users/set-role/route.ts`
- `app/api/admin/users/set-supervision/route.ts`
- `app/api/me/role/route.ts`


### Live study and session authorization (10)

- `app/api/live/session/[sessionId]/end/route.ts`
- `app/api/live/session/[sessionId]/feed/[postId]/response/route.ts`
- `app/api/live/session/[sessionId]/feed/route.ts`
- `app/api/live/session/[sessionId]/presence/route.ts`
- `app/api/live/session/[sessionId]/route.ts`
- `app/api/live/session/[sessionId]/state/route.ts`
- `app/api/study-sessions/[id]/google-meet/route.ts`
- `app/live/[sessionId]/page.tsx`
- `app/live/actions.ts`
- `app/studies/[id]/present/page.tsx`


### Member account surfaces (3)

- `app/dashboard/page.tsx`
- `app/more/page.tsx`
- `app/profile/page.tsx`


### Studio administration (15)

- `app/studio/directory/actions.ts`
- `app/studio/directory/page.tsx`
- `app/studio/directory/partnerships/page.tsx`
- `app/studio/directory/review/page.tsx`
- `app/studio/giving/actions.ts`
- `app/studio/giving/budget/page.tsx`
- `app/studio/giving/campaigns/page.tsx`
- `app/studio/giving/communications/page.tsx`
- `app/studio/giving/compliance/page.tsx`
- `app/studio/giving/page.tsx`
- `app/studio/giving/stories/page.tsx`
- `app/studio/giving/transactions/page.tsx`
- `app/studio/impact/actions.ts`
- `app/studio/impact/page.tsx`
- `app/studio/page.tsx`

### Shared libraries and components (4)

- `components/AdminAnalyticsClient.tsx`
- `components/AdminUsersClient.tsx`
- `components/AuthControls.tsx`
- `lib/role-access.ts`

The application section totals 51 paths. Rerun the repository search when implementation begins; the count is only as complete as the search patterns.

## Migration files matching the first-pass search (13)

- `supabase/migrations/20260730000000_core_profiles_baseline.sql`
- `supabase/migrations/20260907130000_ministry_hub_content_foundation.sql`
- `supabase/migrations/20260907133000_ministry_memberships_and_event_details.sql`
- `supabase/migrations/20260907174500_ministry_leader_permissions.sql`
- `supabase/migrations/20260907181500_bible_study_viewer_foundation.sql`
- `supabase/migrations/20260907190000_admin_notification_campaigns.sql`
- `supabase/migrations/20260912185500_create_content_catalog.sql`
- `supabase/migrations/20260915202000_google_meet_study_sessions.sql`
- `supabase/migrations/20260915234000_live_study_participants.sql`
- `supabase/migrations/20260916010000_study_groups_daily_path.sql`
- `supabase/migrations/20260916030100_role_hierarchy.sql`
- `supabase/migrations/20260929223000_tighten_study_session_read_access.sql`
- `supabase/migrations/20261112013759_bind_rls_helpers_to_caller.sql`

## Recommended classification pass

For every matched and newly discovered consumer, record:

1. whether it checks identity, active-account state, capability, or scope;
2. whether the check controls a page, a server action, an API, an RLS policy, or presentation only;
3. its current allow and deny behavior for member, facilitator, supervisor, admin, and inactive users;
4. the replacement role assignment and scope rule, if any;
5. a regression check for both an allowed and a denied path.

Do not mass-replace `profiles.role` checks. The compatibility field remains authoritative until each consumer has an explicit replacement and existing access parity is verified.
