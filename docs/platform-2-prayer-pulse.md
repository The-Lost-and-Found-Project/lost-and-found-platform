# Platform 2.0 — Prayer Pulse

Prayer Pulse is the signed-in community window into the ministry's prayer life. It is intentionally not a generic social feed.

## Interaction contract

- Prayer is an ongoing action. A member may mark that they prayed for the same request more than once across intentional prayer moments.
- Praise love is limited to one per member.
- Testimony encouragement is limited to one per member.
- Authors cannot react to their own prayer, praise, or testimony.
- Preview surfaces stay concise and open into the existing complete detail experiences.
- The experience avoids vanity-metric framing.

## Journey

Prayer → Praise → Testimony is a ministry continuity model: a need can later become a celebration of God's faithfulness and, where appropriate, a testimony that gives someone else hope.

## Architecture

Prayer Pulse reuses the existing PrayerWallTicker, PraiseTicker, TestimonyTicker, API routes, Supabase tables, RLS/security controls, and member interaction rules. It introduces no duplicate backend or authentication system.
