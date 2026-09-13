# Platform 2.0 — Interactive Ministry Spaces

Ministry pages are participation environments, not static department pages.

## Current spaces

- The Hearth: gathering, belonging, hospitality, encouragement, praise, prayer, and practical care.
- The Foundry: formation, practice, service, accountability, and reflection.
- Men's Study: Scripture study, honest discussion, application, gatherings, prayer, and an intelligent handoff into Emmaus for deeper study.

## Shared architecture

Each space uses the data-driven `ministryPortals` configuration plus the existing `ministry_content` and `ministry_memberships` tables. Members can follow/unfollow a space, see published content and gatherings, and take meaningful actions into the rest of L&F.

This phase deliberately preserves the existing Supabase/auth model and Emmaus identity handoff. It adds no duplicate backend, community system, or Rare Network functionality.

## Product rule

A ministry space should answer three questions quickly:

1. What is this space for?
2. What is happening here now?
3. What meaningful action can I take next?

Future ministry spaces should be added through the same expandable model rather than creating one-off product architectures.
