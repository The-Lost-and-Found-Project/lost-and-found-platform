# Google Meet Integration Foundation

## Objective

Use Google Meet as the video layer for L&F live studies while keeping The Lost and Found Project app as the ministry workflow and member experience.

## Verified platform assumptions (September 2026)

- Google Workspace for Nonprofits supports up to 150 Google Meet participants.
- Workspace for Nonprofits is expected to support meetings up to 24 hours; run one 75-90 minute production-account smoke test before retiring Zoom.
- Google Meet REST API can create meeting spaces and manage meeting-space members, including COHOST roles.
- Meet REST API requires user authentication. Domain-wide delegation may be used so an L&F service account can impersonate an authorized Workspace user without requiring each facilitator to complete an OAuth consent flow.
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

## Authentication model

Preferred production model:

- Google Cloud project owned by The Lost and Found Project
- Google Meet REST API enabled
- service account configured for domain-wide delegation
- Workspace Admin authorizes the narrow Meet scopes required by L&F
- server-side code impersonates a dedicated Workspace organizer account such as meetings@lostandfoundproject.org
- facilitator accounts may be added as COHOST members when the meeting is provisioned

Do not expose Google service-account credentials or delegated tokens to the browser.

Initial scope:

`https://www.googleapis.com/auth/meetings.space.created`

Add broader scopes only when a feature truly requires them.

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
- Never place delegated Google credentials in `NEXT_PUBLIC_*` variables.
- Avoid automatic recording of ordinary pastoral/small-group meetings unless L&F later establishes a clear consent and retention policy.

## Environment variables

Server-only variables expected for the production integration:

- `GOOGLE_MEET_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_MEET_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_MEET_DELEGATED_ORGANIZER`

The delegated organizer should be an L&F Google Workspace identity, not a personal Gmail account.

## Launch checklist

1. Confirm L&F Google Workspace is activated as Workspace for Nonprofits, not merely Google for Nonprofits eligibility.
2. Run a 75-90 minute, 3+ participant Meet using the actual L&F organizer identity; verify no 60-minute cutoff warning.
3. Create/choose the Google Cloud project owned by L&F.
4. Enable Google Meet REST API.
5. Create service account and enable domain-wide delegation.
6. Authorize the narrow Meet scope in Workspace Admin.
7. Configure Vercel server-side environment variables.
8. Implement server-only Meet client and meeting provisioning action.
9. Attach generated Meet session to `study_sessions`.
10. Test admin -> facilitator -> participant flow on desktop and mobile.
11. Keep Zoom available during pilot; retire routine Zoom use only after the smoke test and pilot succeed.

## Cost posture

Phase 1 should not require a per-facilitator Zoom-style paid seat if the facilitators are using the L&F Workspace/Meet model. Google Cloud API calls for this integration are not intended to replace the video service; Meet remains the conferencing layer and L&F uses the API for provisioning and workflow orchestration.
