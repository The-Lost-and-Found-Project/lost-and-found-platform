# Privileged database function audit — 2026-11-12

Scope: public-schema SECURITY DEFINER functions in L&F Supabase. This is an evidence-based triage, not a penetration-test certification. Do not remove execute permissions without verifying RLS dependencies and public page callers.

## Immediate findings

- `is_lfp_admin(uid uuid)`: privileged function accepts an arbitrary user ID and returns that user's admin status without tying the input to `auth.uid()`. This is an information disclosure / authorization helper design weakness. A separate zero-argument `is_lfp_admin()` function correctly checks the caller and active profile. Audit every SQL policy and caller before changing the legacy overload.
- `has_locked_group_response(uid,sid,dnum)` and `is_daily_path_day_unlocked(uid,sid,dnum)`: privileged functions accept arbitrary user IDs and expose whether another user has responded or unlocked a study day. Audit RLS dependencies and tighten caller binding while preserving policy behavior.
- `is_study_group_facilitator(uid,gid)`: privileged helper accepts arbitrary user ID; callers can query another person's facilitator status. Confirm policy use before modifying.
- `get_active_giving_campaigns`, `get_active_ministry_impact_areas`, `get_directory_entries`, `get_published_ministry_stories`, `get_verified_ministry_impact_updates`: intentionally public-facing content queries. Validate that all returned columns are approved for public display and only published/active rows are returned.

## Required release gates

1. Inventory `pg_depend`, `pg_policies`, RPC usage and any SQL migrations referencing each function signature.
2. Prove public and authenticated behavior with synthetic identities and ensure no private row or status leaks.
3. Where practical, move privileged helpers to a non-exposed schema or use invoker rights. When definer is required, bind identity to `auth.uid()`, pin `search_path`, revoke `PUBLIC` execution and grant only the minimum role.
4. Apply on a local database first, run the full test suite and SQL isolation tests, then ship a reviewable migration with rollback notes.
5. Re-run Supabase security advisors after release. Do not mark these warnings resolved solely because a policy name changed.

## Other security backlog

- Enable compromised-password protection after checking Auth settings and plan availability.
- Inspect 3 mutable-search-path functions.
- Review 14 RLS-enabled tables without policies for deliberate deny-all design.
- Prioritize database performance findings by real query timings, not warning counts alone.
