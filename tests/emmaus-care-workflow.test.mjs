import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("Emmaus data and protected routes remain intact but are absent from Community Home", async () => {
  const [nav, frame, emmausLayout, adminLayout, dashboard, me] = await Promise.all([
    source("components", "emmaus", "EmmausBottomNav.tsx"),
    source("components", "AppFrame.tsx"),
    source("app", "emmaus", "layout.tsx"),
    source("app", "emmaus", "admin", "layout.tsx"),
    source("app", "dashboard", "page.tsx"),
    source("app", "emmaus", "me", "page.tsx"),
  ]);

  for (const destination of ["/emmaus/walk", "/emmaus/bible", "/emmaus/discover", "/emmaus/me"]) {
    assert.match(nav, new RegExp(destination.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(nav, /\/emmaus\/admin/);
  assert.match(frame, /pathname\.startsWith\("\/emmaus"\)/);
  assert.match(emmausLayout, /EMMAUS_FOUNDER_EMAIL/);
  assert.match(emmausLayout, /if \(!isEmmausFounder\)/);
  assert.match(emmausLayout, /redirect\("\/dashboard"\)/);
  assert.match(adminLayout, /profile\?\.role !== "admin"/);
  assert.doesNotMatch(dashboard, /if \(isEmmausFounder\) redirect\("\/emmaus\/walk"\)/);
  assert.doesNotMatch(dashboard, /href="\/emmaus/);
  assert.doesNotMatch(dashboard, /Private Founder Lab/);
  assert.match(me, /Open Lost & Found Platform/);
});

test("Emmaus progress has authenticated table privileges in addition to RLS", async () => {
  const migration = await source("supabase", "migrations", "20260810184134_normalize_emmaus_care_workflow.sql");
  assert.match(migration, /grant select, insert, update, delete[\s\S]*emmaus_discovery_progress[\s\S]*to authenticated/);
  assert.doesNotMatch(migration, /to anon/);
});

test("Community rebuild retires active Prayer Care while preserving legacy records", async () => {
  const [migration, cron, deactivateRoute, statuses] = await Promise.all([
    source("supabase", "migrations", "20260817005006_retire_prayer_care_architecture.sql"),
    source("app", "api", "cron", "notify-stale-assignments", "route.ts"),
    source("app", "api", "admin", "users", "set-active", "route.ts"),
    source("components", "AdminPrayerDashboardClient.tsx"),
  ]);

  assert.match(migration, /legacy_prayer_care_assignments/);
  assert.match(migration, /legacy_prayer_care_members/);
  assert.match(migration, /drop trigger if exists assign_next_care_team_member_trigger/);
  assert.match(migration, /set role = 'member'/);
  assert.match(migration, /set assigned_to = null/);
  assert.match(cron, /retired: true/);
  assert.doesNotMatch(deactivateRoute, /assigned_to|reassign_prayer_request|responsibilit/i);

  for (const status of ["Submitted", "Reviewed", "Resolved", "Closed", "Escalated", "Withdrawn"]) {
    assert.match(statuses, new RegExp(`"${status}"`));
  }
  assert.doesNotMatch(statuses, /Assigned|Needs Reassignment|careTeam|assigned_to/);
});
