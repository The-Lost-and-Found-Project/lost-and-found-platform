# Migration history reconciliation

Status: completed as a controlled exception on 2026-11-12.

## Source-of-truth rules

- The hosted Production schema and migration ledger are authoritative for existing live state.
- `main` is authoritative for new reviewed migrations.
- Migration filenames are immutable identifiers. Do not rename, delete, rewrite, or replay a historical migration to make two inventories match.
- Production data, Bible studies, donor records, and push state must remain untouched during reconciliation.

## Recorded inventory

The read-only inventory was captured from repository commit `b3e9e41464f6973caea1213d4423168435476f9b` and Production project `lsxaadzyonvvdbzewpql`:

| Source | Count |
| --- | ---: |
| Repository `supabase/migrations` versioned SQL files | 97 |
| Hosted Production migration rows | 125 |
| Exact version/name overlaps | 10 |
| Repository-only versions | 87 |
| Hosted-only versions | 115 |

The overlap and difference counts describe migration history, not schema drift. A repository-only or hosted-only row is not evidence that SQL is missing or safe to replay: earlier workflows, rebases, renamed migrations, and direct hosted changes can all produce these differences.

## Release-specific evidence

The PR #219 migration `20261112090000_harden_prayer_request_member_guard` was applied with its exact repository SQL and passed the Production postflight checks. A later runtime-generated ledger row with the same migration name was preserved as audit history; it was not deleted or rewritten.

## Future reconciliation procedure

1. Export repository and hosted inventories read-only.
2. Compare version, name, and SQL hash where the hosted body is available.
3. Classify differences as equivalent, hosted-only, repository-only, or genuinely missing.
4. Validate any proposed change in an isolated schema-only or disposable environment.
5. Obtain independent review for any genuinely missing change.
6. Apply approved changes one at a time with preflight, postflight, and recorded hashes.

Never run an unrestricted `supabase db push`, bulk replay, ledger repair, or historical deletion as a reconciliation shortcut.
