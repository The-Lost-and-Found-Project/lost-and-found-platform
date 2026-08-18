# Emmaus Separation Checkpoint

This file records the current read-only audit findings and the safe migration sequence for separating Emmaus from the Community App.

## Current state

- The Community App runs on Next.js 16.2.6, React 19.2.6, TypeScript 5.9, and Supabase.
- Emmaus learner and founder routes have already been removed from the Community runtime and preserved under `standalone-products/source/app/emmaus`.
- Emmaus API source is preserved under `standalone-products/source/app/api/emmaus`; the current preserved API surface includes the Bible chapter API subtree.
- Shared Emmaus components and libraries remain under `components/emmaus` and `lib/emmaus`.
- Existing Supabase migrations include Emmaus discovery progress, XP, achievements, journeys, relationships, discovery maps, Scripture/KJV corpus, graph/history, founder authorization, Bible progress, and care workflow infrastructure.
- Existing Emmaus data and Supabase objects must remain untouched until the standalone application is verified.

## Migration boundary

Migrate or recreate inside the standalone Emmaus project:

- preserved Emmaus routes from `standalone-products/source/app/emmaus`
- preserved Emmaus API routes from `standalone-products/source/app/api/emmaus`
- Emmaus-specific code from `components/emmaus` and `lib/emmaus`
- only the Supabase helpers, styles, assets, and utilities actually imported by Emmaus
- Emmaus-specific tests and database-policy tests

Leave behind unless an Emmaus dependency is proven:

- Community, prayer, praise, testimony, events, programs, and unrelated admin routes
- Community notification, email, push, cron, and moderation systems
- unrelated product source such as Trivia and Devotions
- unrelated environment variables and service integrations

## Key risks

1. Emmaus still imports shared paths such as `@/lib/supabase/server`, so dependency extraction must precede route copying.
2. Discovery progress has multiple historical migrations and dedicated access tests; do not recreate or rename these tables blindly.
3. The current Bible page is content-pack driven rather than a complete provider-based Scripture reader, so it should be preserved first and evolved later.
4. Existing Supabase RLS and user data must be preserved. No production schema changes are part of the initial separation.
5. Scripture text and translation licensing must be reviewed before adding any new translation or provider.

## Target architecture

The standalone Emmaus project should be one responsive Next.js web application containing:

- public website routes
- authenticated study routes
- Supabase authentication and user-study data
- a modular Scripture provider layer
- a clean Bible reader
- guided discovery and study workspace features
- provider abstractions for Scripture, original language, lexicon, cross references, commentary, maps, and timelines

The Community App should remain operational and independent while Emmaus is built and verified.

## Safe migration sequence

1. Inventory imports used by the preserved Emmaus routes and APIs.
2. Build a minimal standalone Next.js scaffold without connecting production deployment or DNS.
3. Copy only required Supabase client/server auth helpers and verify login locally/preview-only.
4. Copy the Emmaus landing route and one known-good discovery flow.
5. Copy required `components/emmaus` and `lib/emmaus` dependencies incrementally.
6. Connect to the existing Supabase project only after RLS and auth behavior are verified.
7. Verify discovery progress saving before adding new study features.
8. Bring over the existing Bible/content-pack experience intact.
9. Add the provider abstraction around Scripture access without changing displayed Scripture behavior.
10. Only after parity is verified, begin the new Bible reader, Verse Study Panel, word study, and guided discovery architecture.

## First implementation checkpoint

This branch intentionally makes no production runtime, database, Vercel, DNS, or credential changes. The next code change should be the minimal standalone Emmaus application scaffold, followed by dependency-by-dependency migration.
