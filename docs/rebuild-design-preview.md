# L&F rebuild design preview

This first implementation package adds `/rebuild-preview` as a public, read-only design sample. It does not replace the public home, member dashboard, or current administration screens. The route is intentionally available without sign-in because the preview deployment uses isolated synthetic authentication that cannot accept real L&F passwords.

The preview contains three switchable surfaces:

- Administration: the approved cream sidebar, compact overview, attention queue, schedule, a role-aware master calendar, an assignment and role-based work queue, a Scripture-centered Studies workspace, a sample People & roles workspace, a sample Prayer review workspace, and notification and profile-sharing settings.
- Public homepage: the approved typography-led direction with Luke 19:10 as the focal Scripture.
- Member home: personal study continuation, groups, commitments, and a personal calendar.

All counts, events, studies, role requests, tasks, and assignments are synthetic design fixtures. Studies presents a sample library, group pacing, and an Emmaus connection view. It reflects the existing connected Emmaus sign-in and shows study sharing/progress sync as a design question, without reading or changing Emmaus content or progress. The My tasks workspace separates assigned work from queues available through approved roles, with role filters, due cues, and direct task entry points. Member home shows only personal assignments. The People & roles screen includes a searchable shared-profile directory that lists only members who opted into sharing their directory name, plus role requests, scoped delegation, and current access; it preserves the existing Supervisor lane and Owner-only administrator boundary. Directory cards reveal only sample fields marked as shared, and contact fields remain hidden unless individually shared. Prayer review separates visitor submissions awaiting public clearance, member requests with member-selected audiences, and cleared public requests. Notification settings show every category enabled by default, individual opt-outs, and a sample sign-in push prompt with Enable and Not now choices. Profile sharing keeps each field private by default, gives contact fields independent switches, and previews the fields visible to the selected audience. The calendar workspace combines master or personal scope with category, ministry, and role filters. Sample entries show which approved roles can see an event and who is assigned; an expandable guide explains that assigned access and approved role access remain distinct. These are presentation samples, not authorization. Visitor submissions are public-only; member privacy is never broadened by moderation. Preview buttons display explanations. There are no submission, approval, membership, preference, account, or content writes. The push prompt does not invoke the browser permission API. The client has no API calls or browser storage access. No new dependency or paid service is introduced.

The shared app frame omits its existing header, footer, bottom navigation, floating actions, and push-subscription sync on this exact preview route to avoid duplicate navigation and automatic subscription side effects. Existing routes retain their behavior. The preview is marked noindex.

## Review flow

1. Open `/rebuild-preview` on the preview deployment; no account is needed.
2. Compare Administration, Public homepage, and Member home using the clearly labeled review controls.
3. On a narrow screen, open and close Menu. Confirm there is no horizontal page scrolling and only one application menu.
4. Open Members → Member directory. Search the sample names and confirm only opted-in directory names and shared fields appear.
5. Open Role requests, Delegation, and Current access. Verify the Owner-only administrator boundary is visible.
6. Open Ministry tools → Studies. Compare Study library, Groups & pacing, and Emmaus connection. Confirm the connected login is acknowledged and progress sync is shown as a separate design item.
7. Open My tasks. Compare All work, Assigned to me, and Role queues; narrow by role and confirm the member view contains only personal assignments.
8. Open Calendars. Change master/personal scope, category filter, ministry, and role. Verify combined filtering, role and assignment labels, the sharing guide, and the empty-result state.
9. Open section information icons. Confirm the explanation remains optional and readable.
10. Open sample review actions. Verify that an explanatory message appears and no real approval is performed.
11. Open Settings → Notifications. Confirm all five categories start on, can be turned off individually, and the push prompt offers Enable and Not now without triggering a browser permission request.
12. Open Settings → Profile sharing. Confirm every field starts private, contact fields are independent, and the preview reflects only selected fields.
13. Open Ministry tools → Prayer review. Switch among Visitor requests, Member requests, and Cleared public. Confirm pending visitor requests are hidden from the public, and the member audience stays Prayer team only.
14. Exit the preview to return to existing administration.

## Validation

Five focused regression checks cover calendar-scope composition, combined filtering, fixture immutability, public noindex route behavior, and absence of client-side production writes. TypeScript and focused ESLint checks are run separately from the repository's build configuration, which currently ignores TypeScript build errors.

On the unchanged `origin/main` baseline, the full unit suite has eight failures, including a malformed active-guard test and outdated source-string assertions. The preview branch has the same eight failures and adds five passing checks. These baseline failures must not be described as a passing full suite.

Local Chromium failed to launch in this workspace. The public sample was reviewed in a connected browser: Prayer review, People & roles, and Settings fit a 390px viewport without horizontal page overflow; all prayer tabs, the push prompt dismissal, and profile-sharing preview were inspected. No real browser notification permission was requested. Notification and profile-sharing switches are local design state only and were not tested for persistence. No production data fixture is included in this change.

The calendar view remains a design prototype: it does not create events, configure real sharing, enforce access, or connect to member calendars. Delegated approvals, privacy sharing persistence, event registration, role expansion, and cross-application progress are not implemented by this visual preview.
