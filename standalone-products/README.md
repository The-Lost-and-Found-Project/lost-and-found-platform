# Standalone product source staging

This directory preserves the route and API source removed from the Community App runtime during Phase 3.

- `source/app/emmaus` contains EMAS / Emmaus learner and founder routes.
- `source/app/trivia` and `source/app/admin/trivia` contain Bible Trivia routes.
- `source/app/devotions` and `source/app/admin/devotions` contain Devotions routes.
- `source/app/api` contains their server endpoints and the retired Devotions publisher.

Shared product components and libraries remain under `components/` and `lib/` until destination repositories are approved. Supabase tables, policies, functions, views, Storage objects, member progress, questions, attempts, devotionals, and audio remain unchanged.

Do not delete this staging source or its Supabase data when creating the standalone apps. Copy and verify each product into its destination before removing the preserved source from this repository.
