# Google Meet Integration Foundation

## Objective

Use Google Meet as the video layer for L&F live studies while keeping The Lost and Found Project app as the ministry workflow and member experience.

## Verified platform assumptions (September 2026)

- Google Workspace for Nonprofits supports up to 150 Google Meet participants.
- Workspace for Nonprofits is expected to support meetings up to 24 hours; run one 75-90 minute production-account smoke test before retiring Zoom.
- Google Meet REST API can create meeting spaces and manage meeting-space members, including COHOST roles.
- Google Meet cannot be embedded as a complete production meeting UI inside an arbitrary L&F iframe.
- Google Meet Add-ons SDK supports the inverse model: L&F can run inside Meet as a side panel and/or main-stage collaborative experience.
- Google Meet Media API is Developer Preview and should not be a production dependency for the first release.

## Product direction

### Phase 1 - L&F launches and manages Meet

Member flow:

1. Member opens a Hearth, Foundry, or Men's Study session in L&F.
2. L&F displays the session details and a Join Live Study button.
3. The button opens the Google Meet space created for that session.
4. After the session, L&F returns the member to the study/devotional workflow.

Facilitator flow:

1. Admin assigns an approved facilitator and session time.
2. L&F creates a Google Meet space for the session.
3. L&F assigns the facilitator as a meeting-space COHOST when appropriate.
4. L&F stores the Meet space resource name, meeting code, meeting URI, organizer identity, and lifecycle status.
5. Members see only the Join Live Study experience; they do not create or manage meetings manually.

### Phase 2 - L&F Study Companion inside Google Meet

Build a Google Meet add-on that loads an L&F companion in Meet's side panel and optional main stage. Candidate capabilities:

- current Scripture reference
- slide/current teaching point
- discussion prompt
- facilitator notes (facilitator-only)
- prayer prompt
- session timer
- journaling prompt
- move-to-next-point controls
- end-study action that activates the post-session devotional rhythm in L&F

This keeps Google responsible for audio/video while L&F owns the ministry experience.

## Production authentication model

Production uses **keyless authentication**. No Google service-account private key is created or stored in Vercel.

Configured infrastructure:

- Google Cloud project: `the-lost-and-found-project`
- Google Cloud project number: `66404996772`
- Google Meet REST API: enabled
- IAM Service Account Credentials API: enabled
- service account: `lf-meet-provisioner@the-lost-and-found-project.iam.gserviceaccount.com`
- delegated Workspace organizer: `meetings@lostandfoundproject.org`
- Workspace domain-wide delegation OAuth client ID: `102799411913493904211`
- authorized Workspace scope: `https://www.googleapis.com/auth/meetings.space.created`
- Workload Identity Pool: `vercel`
- Workload Identity Provider: `vercel`
- Vercel team OIDC issuer: `https://oidc.vercel.com/lostandfoundteam`
- Vercel OIDC audience: `https://vercel.com/lostandfoundteam`
- authorized Vercel subject: `owner:lostandfoundteam:project:lost-and-found-platform:environment:production`

Authentication flow:

1. Vercel injects a short-lived `VERCEL_OIDC_TOKEN` into the production function runtime.
2. L&F exchanges that token with Google Security Token Service for a short-lived federated Google access token.
3. The federated principal is permitted to call `iam.serviceAccounts.signJwt` on the Meet provisioner service account.
4. L&F asks Google IAM Credentials to sign a domain-wide-delegation JWT for `meetings@lostandfoundproject.org`.
5. L&F exchanges the signed JWT for a short-lived Google OAuth access token scoped only to `meetings.space.created`.
6. L&F calls the Google Meet REST API to create the meeting and, when applicable, assign the facilitator as a co-host.

The organization policy that blocks service-account key creation should remain enabled.

## Configuration

The production values are pinned as safe, non-secret defaults in `lib/google-meet/server.ts`. They may be overridden for another deployment with:

- `GOOGLE_MEET_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_MEET_DELEGATED_ORGANIZER`
- `GOOGLE_MEET_WORKLOAD_IDENTITY_PROVIDER`

`VERCEL_OIDC_TOKEN` is supplied automatically by Vercel when OIDC Federation is active. Never create or add `GOOGLE_MEET_SERVICE_ACCOUNT_PRIVATE_KEY`.

## Data model

Do not keep a single permanent meeting URL on `bible_studies` as the long-term meeting model. A study is reusable content; a live gathering is a session instance.

Use `study_sessions` for scheduled/live meetings and preserve `bible_studies.meeting_url` only as a compatibility fallback during migration.

Recommended fields:

- id
- bible_study_id
- ministry_slug
- facilitator_user_id
- scheduled_start
- scheduled_end
- status
- google_space_name
- google_meeting_code
- google_meeting_uri
- google_organizer_email
- created_by
- created_at
- updated_at

## Security rules

- Members may read a session only when they are authorized to access its ministry/study.
- Facilitators may read sessions assigned to them.
- Meeting creation, co-host assignment, moderation updates, and ending a meeting are server-only operations.
- The Google WIF IAM binding is restricted to the Vercel production subject for `lost-and-found-platform`.
- No long-lived Google credential is stored in Vercel or GitHub.
- Avoid automatic recording of ordinary pastoral/small-group meetings unless L&F later establishes a clear consent and retention policy.

## Launch checklist

1. Google Workspace for Nonprofits active. **Complete**
2. Google Cloud project owned by `lostandfoundproject.org`. **Complete**
3. Google Meet REST API enabled. **Complete**
4. Dedicated service account created. **Complete**
5. Dedicated organizer `meetings@lostandfoundproject.org` created. **Complete**
6. Domain-wide delegation authorized for only `meetings.space.created`. **Complete**
7. Vercel Team OIDC verified. **Complete**
8. Google Workload Identity Federation configured and restricted to L&F production. **Complete**
9. Keyless server-side Meet client implemented. **Complete in PR**
10. Apply `study_sessions` migration and deploy the application changes.
11. Provision a real meeting through L&F and test admin -> facilitator -> participant flow on desktop and mobile.
12. Run a 75-90 minute, 3+ participant Meet using the actual L&F organizer identity; verify no 60-minute cutoff warning.
13. Keep Zoom available during the pilot; retire routine Zoom use only after the smoke test and pilot succeed.

## Cost posture

Phase 1 should not require a per-facilitator Zoom-style paid seat if facilitators use the L&F Workspace/Meet model. Google remains the conferencing layer while L&F uses the APIs only for provisioning and workflow orchestration.
