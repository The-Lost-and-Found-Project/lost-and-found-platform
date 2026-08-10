import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("Emmaus learner navigation uses working non-admin destinations", async () => {
  const [nav, frame, adminLayout, dashboard] = await Promise.all([
    source("components", "emmaus", "EmmausBottomNav.tsx"),
    source("components", "AppFrame.tsx"),
    source("app", "emmaus", "admin", "layout.tsx"),
    source("app", "dashboard", "page.tsx"),
  ]);

  for (const destination of ["/emmaus/walk", "/emmaus/bible", "/emmaus/discover", "/emmaus/me"]) {
    assert.match(nav, new RegExp(destination.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(nav, /\/emmaus\/admin/);
  assert.match(frame, /pathname\.startsWith\("\/emmaus"\)/);
  assert.match(adminLayout, /profile\?\.role !== "admin"/);
  assert.match(dashboard, /if \(isEmmausFounder\) redirect\("\/emmaus\/walk"\)/);
});

test("Emmaus progress has authenticated table privileges in addition to RLS", async () => {
  const migration = await source("supabase", "migrations", "20260810184134_normalize_emmaus_care_workflow.sql");
  assert.match(migration, /grant select, insert, update, delete[\s\S]*emmaus_discovery_progress[\s\S]*to authenticated/);
  assert.doesNotMatch(migration, /to anon/);
});

test("care workflow separates account access, availability, and request status", async () => {
  const [migration, cron, deactivateRoute, statuses] = await Promise.all([
    source("supabase", "migrations", "20260810184134_normalize_emmaus_care_workflow.sql"),
    source("app", "api", "cron", "notify-stale-assignments", "route.ts"),
    source("app", "api", "admin", "users", "set-active", "route.ts"),
    source("components", "AdminPrayerDashboardClient.tsx"),
  ]);

  for (const availability of ["available", "limited", "away", "inactive"]) {
    assert.match(migration, new RegExp(`'${availability}'`));
  }
  assert.match(cron, /ministry_availability: "limited"/);
  assert.match(cron, /availability_review_required: true/);
  assert.doesNotMatch(cron, /movedToInactive|THIRTY_DAYS_MS/);
  assert.match(deactivateRoute, /ACTIVE_RESPONSIBILITIES/);
  assert.match(deactivateRoute, /bulk_reassign/);
  assert.match(deactivateRoute, /return_to_queue/);

  for (const status of [
    "Submitted", "Reviewed", "Assigned", "Active Care", "Follow-Up",
    "Resolved", "Closed", "Needs Reassignment", "Escalated",
    "Unable to Contact", "Withdrawn",
  ]) {
    assert.match(statuses, new RegExp(`"${status}"`));
  }
});
