# L&F rebuild design preview

This first implementation package adds `/rebuild-preview` as a public, read-only design sample. It does not replace the public home, member dashboard, or current administration screens. The route is intentionally available without sign-in because the preview deployment uses isolated synthetic authentication that cannot accept real L&F passwords.

The preview contains three switchable surfaces:

- Administration: the approved cream sidebar, compact overview, attention queue, schedule, and calendar.
- Public homepage: the approved typography-led direction with Luke 19:10 as the focal Scripture.
- Member home: personal study continuation, groups, commitments, and a personal calendar.

All counts, events, studies, and assignments are synthetic design fixtures. Preview buttons display explanations. There are no submission, approval, membership, preference, account, or content writes. The calendar controls demonstrate presentation filtering, not authorization. The client has no API calls or browser storage access. No new dependency or paid service is introduced.

The shared app frame omits its existing header, footer, bottom navigation, floating actions, and push-subscription sync on this exact preview route to avoid duplicate navigation and automatic subscription side effects. Existing routes retain their behavior. The preview is marked noindex.

## Review flow

1. Open `/rebuild-preview` on the preview deployment; no account is needed.
2. Compare Administration, Public homepage, and Member home using the clearly labeled review controls.
3. On a narrow screen, open and close Menu. Confirm there is no horizontal page scrolling and only one application menu.
4. Change calendar view, category filter, and ministry. Verify combined filtering and the empty-result state.
5. Open section information icons. Confirm the explanation remains optional and readable.
6. Open sample review actions. Verify that an explanatory message appears and no real approval is performed.
7. Exit the preview to return to existing administration.

## Validation

Five focused regression checks cover calendar-scope composition, combined filtering, fixture immutability, public noindex route behavior, and absence of client-side production writes. TypeScript and focused ESLint checks are run separately from the repository's build configuration, which currently ignores TypeScript build errors.

On the unchanged `origin/main` baseline, the full unit suite has eight failures, including a malformed active-guard test and outdated source-string assertions. The preview branch has the same eight failures and adds five passing checks. These baseline failures must not be described as a passing full suite.

Local Chromium failed to launch in this workspace. Browser layout and interactions remain to be verified on the public sample preview. No production data fixture is included in this change.

The remaining blueprint features—delegated approvals, privacy sharing, event registration, shared calendars, role expansion, and cross-application progress—are not implemented by this visual preview.
