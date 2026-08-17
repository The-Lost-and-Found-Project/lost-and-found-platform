import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");
const retirementMigration = () => source("supabase", "migrations", "20260817005006_retire_prayer_care_architecture.sql");

test("legacy Prayer Care assignments are archived before live ownership is cleared", async () => {
  const migration = await retirementMigration();
  assert.match(migration, /create table if not exists public\.legacy_prayer_care_assignments/);
  assert.ok(migration.indexOf("insert into public.legacy_prayer_care_assignments") < migration.indexOf("set assigned_to = null"));
  assert.match(migration, /on conflict \(prayer_request_id\) do nothing/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table public\.legacy_prayer_care_assignments from public, anon, authenticated/);
});

test("former Prayer Care roles are archived before becoming Community Members", async () => {
  const migration = await retirementMigration();
  assert.match(migration, /create table if not exists public\.legacy_prayer_care_members/);
  assert.ok(migration.indexOf("insert into public.legacy_prayer_care_members") < migration.indexOf("set role = 'member'"));
  assert.match(migration, /where role = 'prayer_team'/);
  assert.match(migration, /preview_role = null/);
});

test("automatic assignment triggers and service execution are disabled", async () => {
  const migration = await retirementMigration();
  for (const trigger of [
    "assign_next_care_team_member_trigger",
    "notify_auto_assigned_care_team_member_trigger",
    "on_prayer_request_assigned_notify",
  ]) assert.match(migration, new RegExp(`drop trigger if exists ${trigger}`));
  assert.match(migration, /revoke all on function public\.assign_next_care_team_member\(\) from public, anon, authenticated, service_role/);
  assert.match(migration, /revoke all on function public\.reassign_prayer_request\(uuid, uuid\) from public, anon, authenticated, service_role/);
});

test("legacy assignment, rotation, and application endpoints cannot mutate data", async () => {
  const routes = [
    ["app", "api", "prayer-assignments", "update", "route.ts"],
    ["app", "api", "rotation", "sabbatical", "route.ts"],
    ["app", "api", "rotation", "unpause", "route.ts"],
    ["app", "api", "rotation", "request-reinstatement", "route.ts"],
    ["app", "api", "admin", "applications", "decide", "route.ts"],
    ["app", "api", "admin", "users", "set-availability", "route.ts"],
  ];
  for (const route of routes) assert.match(await source(...route), /retiredPrayerCareResponse/);
  assert.match(await source("lib", "retired-prayer-care.ts"), /status: 410/);
});

test("people administration exposes only Community Member and Community Admin roles", async () => {
  const [client, route, page] = await Promise.all([
    source("components", "AdminUsersClient.tsx"),
    source("app", "api", "admin", "users", "set-role", "route.ts"),
    source("app", "admin", "users", "page.tsx"),
  ]);
  assert.match(client, /Community Member/);
  assert.match(client, /Community Admin/);
  assert.doesNotMatch(client, /prayer_team|rotation|assignment|availability/i);
  assert.match(route, /new Set\(\["member", "admin"\]\)/);
  assert.doesNotMatch(route, /reassign_prayer_request|assigned_to/);
  assert.doesNotMatch(page, /assigned_to|ministry_availability/);
});

test("submitted requests stay in moderation attention until review", async () => {
  const dashboard = await source("components", "AdminPrayerDashboardClient.tsx");
  assert.match(dashboard, /request\.status === "Submitted"/);
  assert.match(dashboard, /moderation_status: "approved"/);
  assert.match(dashboard, /status: "Reviewed"/);
  assert.doesNotMatch(dashboard, /Assigned|Needs Reassignment|assigned_to/);
});
