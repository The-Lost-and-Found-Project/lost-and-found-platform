# One Flesh, One Foundation — pastoral review and controlled-release checklist

**Status:** All 21 expanded lessons and matching participant/facilitator documents generated; local validation passed. Pastoral sign-off, full visual QA, nonproduction Preview validation, and release approval are still outstanding. NOT approved for production or real participant information.

## Intended experience

- Husband and wife complete 21 daily Scripture readings, discussion prompts, prayers, and practical exercises **together**, without a daily facilitator.
- Each spouse signs into their **own** account to save individual reflections. A shared device must not be treated as a shared login.
- The mentor meets with both spouses after Days 7, 14, and 21. Participants decide what to discuss; journals are not accessible to the mentor.
- A participant must deliberately grant permission and send each mentor update. Revocation removes previously shared updates.
- Joint activities are voluntary. If intimidation, coercion, threats, or retaliation are disclosed, stop joint exercises and arrange appropriate individual support.

## Review sequence — owner approval required

1. Read each of the 21 sessions in order, including Scripture references, original-context notes, heart questions, and exercises. Verify references directly against the Bible and correct any theological or pastoral concerns.
2. Confirm the three weekly facilitator agendas and the couple's preparation prompts match the intended pastoral relationship.
3. Confirm the privacy explanation is understandable: each spouse owns their journal, mentor sharing is opt-in, and revocation removes shared snapshots.
4. Confirm that the participant-facing material does not imply pastoral care replaces qualified trauma-informed counseling, emergency assistance, or postpartum medical care.
5. Approve or request revisions to the complete journey **before** real participants receive invitations.

## November 11 curriculum and document review

- All 21 expanded lessons now include Scripture context, five practical teaching paragraphs, six discussion prompts, and a prayer. The participant workbook pulls the same 21 specific exercises as the app.
- The app lesson page was simplified to show the expanded teaching once, rather than repeating older brief context, reflection, and discussion blocks after the expanded content.
- Both Word documents were generated on the owner's Mac under `Documents/Lost and Found Project/Marriage Journey Review`. Structural inspection verified 21 lessons, exercises, discussion sections, prayers, and three mentor checkpoints.
- macOS Quick Look successfully generated a participant-workbook thumbnail. This is **not** a full page-by-page layout inspection; visual QA remains open.
- TypeScript, 211 automated tests, and production build passed locally after the lesson-page cleanup.
- No authenticated hosted Preview session, database migration, or mobile-device test was performed in this pass.
- Re-ran local Chrome participant and mentor tests with synthetic accounts on November 11: participant sign-in, save/reload, sharing and mentor navigation passed; mentor grant, explicit sharing, isolation, and revocation passed. This is local-only evidence.
- Added and passed a local iPhone-sized (390 × 844) Chrome viewport regression across **all 21 days**, including the private reflection field on every day. Confirmed no horizontal document overflow, synthetic sign-in, private reflection save/reload, and sharing/mentor navigation. Initial run hit an authentication-page readiness race; test now waits for authenticated content. Physical-device, screen-reader accessibility, and hosted Preview QA remain open.

## Technical release gates

- [x] Unit tests, typecheck, and Next.js build passed on development branch.
- [x] Local database RLS tests verified journal isolation and mentor permissions.
- [x] Authenticated local API test verified session save, grant, sharing, and revocation.
- [x] Chrome participant and mentor flows passed using temporary synthetic accounts.
- [ ] Owner completes pastoral/editorial approval of all 21 sessions.
- [ ] Review the actual deployment migration plan and environment configuration; do not use production secrets in test scripts.
- [ ] Validate schema changes and permissions in a nonproduction Preview environment with synthetic accounts.
- [ ] Perform accessibility/mobile QA for the full 21-day sequence and both account roles.
- [ ] Explicit owner approval for merge and deployment; do not infer it from development authorization.
- [ ] Post-release smoke test and rollback procedure agreed before real participant onboarding.

## Review of individual session content

| Day | Theme | Main pastoral review focus |
| --- | --- | --- |
| 1 | Listening | James 1 context; listening without silencing |
| 2 | Emotional responses | Guarding the heart; no forced trauma disclosure |
| 3 | Words and truth | Edifying speech without minimizing concerns |
| 4 | Conflict | Pausing safely; peace is not one person's burden |
| 5 | Repair | Responsibility without forced forgiveness |
| 6 | Understanding needs | Mutual honor and realistic support |
| 7 | Communication covenant | Voluntary commitments and weekly mentor meeting |
| 8 | Shared decisions | Marriage loyalty without coercion |
| 9 | Family before optional ministry | Mark 7 analogy correctly identified |
| 10 | Service | Christlike service without control |
| 11 | Expectations | Naming assumptions without blame |
| 12 | Ministry boundaries | Practical delegation and family availability |
| 13 | Children and belonging | Blended-family stability without forced attachment |
| 14 | Newborn support | Postpartum realities and weekly mentor meeting |
| 15 | Trauma-aware responses | No promise of instant healing |
| 16 | Trust | Forgiveness distinguished from restored trust |
| 17 | Sustainable service | Abiding in Christ without shaming caregiving |
| 18 | Emotional safety | Joint exercise stops if anyone feels unsafe |
| 19 | Prayer | No spiritual pressure or disguised accusations |
| 20 | Habits | Matthew 7 context; sustainable practices |
| 21 | Next thirty days | Mutual goals, optional follow-up, weekly mentor meeting |

## Evidence and repeatable local checks

Run from the repository root with local Supabase services and a locally configured Next.js server:

```sh
npm run typecheck
npm test
npm run build
node scripts/test-marriage-auth-flow-local.cjs
node scripts/test-marriage-browser-local.cjs
node scripts/test-marriage-mentor-browser-local.cjs
```

Browser tests require a local Chrome installation and the nonpersistent `playwright-core` dependency; they do not use production accounts. These tests are evidence of local behavior, **not** proof that Preview or Production has been validated.

## Deployment decision

**Hold.** No merge, migration to hosted environments, publishing, participant invitations, or Production changes until the owner approves the content and deployment separately.
