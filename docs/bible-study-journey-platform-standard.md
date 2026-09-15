# L&F Bible Study Journey — Platform 2.0 Standard

This implementation follows the L&F Bible Study Standard: a 55–65 minute live gathering followed by a 14-day app-based discipleship journey.

## Product behavior

### Facilitator
1. Select an approved Bible study.
2. Start/conduct the live gathering.
3. End the live session.
4. Start Follow-Up Journey.
5. Platform anchors the 14-day schedule to the actual journey start after session completion.
6. Facilitator can Pause, Resume, or End the journey.

### Member
The primary flow is **Today → Read / Reflect / Respond → Mark Complete → Completed**.

The Active experience emphasizes the current released piece. Completed pieces move out of Active. Previously released pieces can remain accessible, but the product must not frame missed pieces as debt or require catch-up.

## 14-day content types

| Day | Type | Intent |
|---|---|---|
| 1 | Dig Deeper | Scripture + substantive teaching |
| 2 | Live It | practical challenge |
| 3 | Scripture Focus | supporting passage/context + reflection |
| 4 | Reflect | light journaling/self-examination |
| 5 | Real Life | relatable scenario/story |
| 6 | Prayer | Scripture-guided prayer |
| 7 | Sabbath / Reset | verse + brief thought + rest |
| 8 | Go Deeper | second substantive teaching |
| 9 | Live It | practical challenge |
| 10 | Scripture Focus | supporting passage/context + reflection |
| 11 | Reflect | light journaling/self-examination |
| 12 | Real Life | relatable scenario/story |
| 13 | Prepare | prepare prayerfully for next gathering |
| 14 | Bridge | close current journey and bridge forward |

Most pieces should take 2–5 minutes. Only roughly 3–4 pieces across the interval should feel like substantial teaching.

## Explicit non-goals

- No streak requirement.
- No public completion leaderboard.
- No forced catch-up.
- No shame-oriented overdue state.
- No automatic completion inferred from opening content.

Completion remains member-controlled.

## Data model

The migration introduces:

- `bible_studies`: approved deployable study package metadata.
- `bible_study_journey_days`: 14 ordered follow-up pieces and release offsets.
- `bible_study_sessions`: live/follow-up lifecycle and facilitator ownership.
- `bible_study_session_members`: enrollment in a specific study cycle.
- `bible_study_day_completions`: explicit member-controlled completion.
- `bible_study_member_day_feed`: security-invoker feed used to derive Today, Active, and Completed states.

## Study package contract

An approved study package should contain: study ID/slug, title, ministry eligibility, deck URL, leader-guide URL, primary/supporting Scripture references, discussion/reflection prompts, Hearth/Foundry variants when applicable, scheduling metadata, and exactly 14 journey-day records.

## Release semantics

Release dates derive from `journey_started_at` plus the day's release offset. Starting follow-up therefore anchors the journey to the actual completed live gathering rather than a hard-coded calendar date.

Pausing stops the journey's active ministry state. A future implementation may shift unreleased dates by pause duration; until that behavior is deliberately implemented, UI should not imply that pause automatically reschedules offsets.

## Notifications

Notifications should be configurable. A notification can point a member to today's released piece, but notification delivery must not change completion state. Do not use notification frequency as a spiritual-engagement score.

## UI derivation

- **Today:** latest released, incomplete day for the member/session.
- **Active:** released, incomplete content, with Today visually dominant and no overdue/shame treatment.
- **Completed:** member completion rows joined to released journey days.
- **Upcoming:** unreleased content should generally be hidden or represented only as a neutral next-release indication.

## Security

Row-level security limits session/member data to the relevant member or facilitator. Member completion inserts are allowed only for the authenticated member, only within a joined session, and only after that journey day has released. Administrative content/session mutation remains service-role controlled; facilitator lifecycle changes use narrowly scoped security-definer functions.
