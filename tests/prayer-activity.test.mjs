import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("the Prayer Wall supports repeatable, idempotent prayer activity", async () => {
  const source = await readFile(path.join(root, "components", "PrayerWallTicker.tsx"), "utf8");

  assert.match(source, /fetch\("\/api\/prayer-activities"/);
  assert.match(source, /retryKeys\.current\.get\(requestId\) \?\? crypto\.randomUUID\(\)/);
  assert.match(source, /retryKeys\.current\.set\(requestId, clientRequestId\)/);
  assert.match(source, /retryKeys\.current\.delete\(requestId\)/);
  assert.match(source, /inFlightIds\.current\.has\(requestId\)/);
  assert.match(source, /disabled=\{pendingIds\.has\(selectedRequest\.id\)\}/);
  assert.match(source, /Prayer recorded/);
  assert.match(source, /aria-live="polite"/);
  assert.doesNotMatch(source, /prayedIds/);
  assert.doesNotMatch(source, /\.from\("prayer_reactions"\)\.insert/);
});

test("the prayer activity route derives identity server-side and handles retries", async () => {
  const source = await readFile(
    path.join(root, "app", "api", "prayer-activities", "route.ts"),
    "utf8"
  );

  assert.match(source, /auth\.getUser\(\)/);
  assert.match(source, /user_id:\s*user\?\.id \?\? null/);
  assert.match(source, /activity_type:\s*"prayed"/);
  assert.match(source, /client_request_id:\s*clientRequestId/);
  assert.match(source, /insertError\?\.code === "23505"/);
  assert.match(source, /\.from\("prayer_wall_public"\)/);
  assert.doesNotMatch(source, /createAdminClient/);
  assert.doesNotMatch(source, /prayer_count:\s*\w+\s*\+/);
});

test("the repeatable prayer migration preserves events and removes identity uniqueness", async () => {
  const migrationsDirectory = path.join(root, "supabase", "migrations");
  const migrationFile = path.join(
    migrationsDirectory,
    "20260730143326_repeatable_prayer_activity.sql"
  );
  const source = await readFile(migrationFile, "utf8");

  assert.match(source, /drop index if exists public\.prayer_reactions_unique_user/);
  assert.match(source, /drop index if exists public\.prayer_reactions_unique_anon/);
  assert.match(source, /prayer_reactions_client_request_id_key/);
  assert.match(source, /legacy_counter_backfill/);
  assert.match(source, /reactions\.prayer_request_id = requests\.id/);
  assert.match(source, /revoke select on table public\.prayer_reactions from anon/);
  assert.match(source, /user_id = \(select auth\.uid\(\)\)/);
});
