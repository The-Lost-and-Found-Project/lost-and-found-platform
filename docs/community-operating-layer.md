# L&F Community Operating Layer

The Lost and Found Project should borrow useful group-operating patterns without becoming a generic social network. The organizing principle is discipleship: **participation over scrolling, presence over performance, and next steps over vanity metrics.**

## Product pattern

### Home: personalized activity, not a generic feed
Home should progressively surface the member's most relevant current activity using existing L&F data: active studies, devotional rhythm, memory reviews, ministry updates, gatherings, prayer activity, Learning Lab, and My Path. Ranking remains deterministic unless a future product decision explicitly introduces another approach.

### Ministry Spaces: one predictable operating structure
Every ministry space should converge on a common mental model while preserving ministry-specific identity:

- Home — current focus, pinned/featured material, next action
- Updates — announcements and current ministry content
- Calendar — gatherings, RSVP/attendance when supported
- Resources — studies, devotionals, media, files/links
- People — membership and facilitator tools, subject to privacy and permissions

Existing `ministry_content` and `ministry_memberships` remain the foundation. Do not create parallel group infrastructure merely to support this UI.

### Contextual create action
Use one recognizable action pattern across mobile experiences. The action changes with context:

- Community: Prayer, Praise, Testimony, Gathering
- Prayer: Submit Prayer
- Ministry member: participate/share only where permissions allow
- Facilitator/admin: Announcement, Gathering, Resource, Study when supported

Do not expose controls that the current authorization model cannot enforce.

### Gatherings and meetings
Treat a meeting as part of a ministry workflow rather than an isolated video link. Target flow:

Schedule -> notify -> RSVP -> join -> attendance -> follow-up -> devotional/study continuation

Build on existing gathering/event data first. Video transport is a separate implementation decision and must not be coupled to the community information architecture.

### Facilitator engagement
Future facilitator views may summarize operational engagement such as attendance, RSVP, assigned devotional completion, or study completion. Avoid surveillance patterns and do not expose private prayer/journal content as engagement analytics. Prefer aggregate completion and explicit member actions.

### Community Challenges
A future challenge model can connect Learning Lab, My Path, ministries, Scripture memory, service, and prayer. Challenges should have a defined spiritual/practical purpose, start/end state, optional group participation, and meaningful completion—not streak pressure for its own sake.

## Delivery order

1. Make Home increasingly activity-aware using existing data.
2. Normalize Ministry Space navigation and featured/current content.
3. Establish contextual create/action UI.
4. Strengthen gathering/event workflow and facilitator controls using existing tables.
5. Add only the minimum schema needed for RSVP/attendance/challenges after auditing existing migrations.
6. Evaluate embedded meeting transport separately; preserve the ability to use an external meeting provider during transition.
7. Add facilitator aggregate engagement after privacy and authorization contracts are explicit.

## Guardrails

- No generic infinite social feed.
- No public popularity leaderboard for prayer, praise, testimony, study, or discipleship.
- No duplicate auth, community backend, or ministry-membership system.
- No exposure of journals, private prayers, or sensitive spiritual notes to facilitators by default.
- No paid meeting/video dependency without explicit approval.
- Emmaus remains the deeper Bible-study ecosystem and is linked rather than rebuilt.
- Rare Network remains completely separate.
