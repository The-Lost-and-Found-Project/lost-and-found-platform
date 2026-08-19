# The Lost and Found Project — Platform

The official ministry platform for The Lost and Found Project: a prayer request, testimony, and praise-report community with a rotating prayer care team, an admin moderation dashboard, and email/push notifications throughout.

Live at [app.lostandfoundproject.org](https://app.lostandfoundproject.org). The marketing site at [lostandfoundproject.org](https://lostandfoundproject.org) is a separate Hostinger-hosted site with a link into this app.

## Stack

- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime, Row Level Security)
- **Email:** Resend
- **Push notifications:** Web Push (VAPID) via a custom service worker
- **CAPTCHA:** Cloudflare Turnstile on public-facing forms
- **Hosting:** Vercel (including Vercel Cron for scheduled jobs)

## Features

- Public Prayer Wall and Testimony Board, with moderated submission (keyword auto-flagging, admin approve/deny/edit)
- Praise reports and a rotating prayer care team that's automatically matched to new requests (with gender preference support, sabbatical/pause self-service, and neglect-based auto-pause)
- Role-based access for members, prayer care team, pastors, and admins, including an admin-only "preview as a role" QA tool
- Admin dashboard covering moderation, user management, applications, analytics, and beta feedback
- Email notifications (welcome, assignment, content-denied, weekly digest, stale-assignment nudges) and in-app + web push notifications for the same events
- PWA support: installable to a home screen, with an app badge and an auto-update prompt

## Getting started

1. Clone the repo and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the values (see below for where each one comes from).
3. Run the SQL migrations in `supabase/` (or your own tracked copy of them) against a Supabase project.
4. `npm run dev` and open `http://localhost:3000`.

### Environment variables

See `.env.example` for the full list. In short:

- Supabase URL/keys come from your Supabase project's API settings.
- `RESEND_API_KEY` comes from Resend, and the sending domain must be verified there.
- The Turnstile keys come from the Cloudflare dashboard for this site.
- The VAPID keypair can be generated locally with `npx web-push generate-vapid-keys`.
- `CRON_SECRET` and `INTERNAL_API_SECRET` are your own generated secrets — in production, `INTERNAL_API_SECRET` lives in Supabase Vault rather than as a plain Vercel env var.

## Notes for contributors

- Run `npm run check` before opening a pull request. The same lint,
  TypeScript, security-contract test, and production-build gate runs in
  GitHub Actions.
- Admin-privileged writes go through server API routes that re-verify the caller's role and use a service-role Supabase client — avoid adding new direct client-side writes to sensitive tables from admin-only components.
- Prayer request moderation actions (approve/deny/flag/edit/assign/mark-answered) are routed through `app/api/admin/prayer-requests/update/route.ts`, which allowlists which columns can be changed.
- RLS policies enforce access at the database level; see the `supabase/` folder for the current tracked copy.

<!-- vercel-production-refresh: 2026-08-19T15:15 -->
