import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("care lifecycle defaults and constraints use only normalized statuses", async () => {
  const migration = await source(
    "supabase",
    "migrations",
    "20260810192414_harden_prayer_care_workflow.sql"
  );

  assert.match(migration, /alter column status set default 'Submitted'/);
  const normalizedConstraint = migration.match(
    /add constraint prayer_requests_status_check[\s\S]*?\)\);/
  )?.[0] ?? "";
  for (const status of [
    "Submitted", "Reviewed", "Assigned", "Active Care", "Follow-Up",
    "Resolved", "Closed", "Needs Reassignment", "Escalated",
    "Unable to Contact", "Withdrawn",
  ]) {
    assert.match(normalizedConstraint, new RegExp(`'${status}'`));
  }
  for (const legacyStatus of ["New", "Being Prayed For", "Contacted", "Ongoing", "Answered"]) {
    assert.doesNotMatch(normalizedConstraint, new RegExp(`'${legacyStatus}'`));
  }
});

test("reassignment is server-only, availability-aware, and updates lifecycle atomically", async () => {
  const migration = await source(
    "supabase",
    "migrations",
    "20260810192414_harden_prayer_care_workflow.sql"
  );

  assert.match(migration, /is_active is true/);
  assert.match(migration, /ministry_availability = 'available'/);
  assert.match(migration, /set assigned_to = null,[\s\S]*status = 'Needs Reassignment'/);
  assert.match(migration, /set assigned_to = next_id,[\s\S]*status = 'Assigned'/);
  assert.match(migration, /revoke all on function public\.reassign_prayer_request\(uuid, uuid\) from authenticated/);
  assert.match(migration, /grant execute on function public\.reassign_prayer_request\(uuid, uuid\) to service_role/);
});

test("first missed assignment is self-restorable while repeated misses require review", async () => {
  const [cron, unpause] = await Promise.all([
    source("app", "api", "cron", "notify-stale-assignments", "route.ts"),
    source("app", "api", "rotation", "unpause", "route.ts"),
  ]);

  assert.match(cron, /nextMissedAssignmentCount >= 2/);
  assert.match(cron, /availability_review_required: requiresHumanReview/);
  assert.match(cron, /return yourself to Available from your Profile/);
  assert.match(unpause, /missed_assignment_count[\s\S]*>= 2/);
  assert.match(unpause, /care leader must review repeated missed assignments/i);
});

test("removing a care role requires reassignment or queue return", async () => {
  const [route, deactivateRoute, availabilityRoute, client] = await Promise.all([
    source("app", "api", "admin", "users", "set-role", "route.ts"),
    source("app", "api", "admin", "users", "set-active", "route.ts"),
    source("app", "api", "admin", "users", "set-availability", "route.ts"),
    source("components", "AdminUsersClient.tsx"),
  ]);

  assert.match(route, /removesCareAccess/);
  assert.match(route, /ACTIVE_RESPONSIBILITIES/);
  assert.match(route, /bulk_reassign/);
  assert.match(route, /return_to_queue/);
  assert.match(route, /ministry_availability: "inactive"/);
  assert.match(route, /ministry_availability: "limited"[\s\S]*for \(const responsibility/);
  assert.match(deactivateRoute, /ministry_availability: "limited"[\s\S]*for \(const responsibility/);
  assert.match(availabilityRoute, /\.update\(changes\)[\s\S]*\.select\("id"\)[\s\S]*reassign_prayer_request/);
  assert.match(client, /roleChangeReview/);
  assert.match(client, /CARE_ROLES\.includes\(u\.role \?\? "member"\)/);
});

test("normal login inactivity is never used as an account-deactivation signal", async () => {
  const routes = await Promise.all([
    source("app", "api", "cron", "notify-stale-assignments", "route.ts"),
    source("app", "api", "admin", "users", "set-active", "route.ts"),
    source("app", "api", "admin", "users", "set-role", "route.ts"),
  ]);
  const combined = routes.join("\n");

  assert.doesNotMatch(combined, /last_sign_in_at|last_login_at|last_login/);
  assert.doesNotMatch(combined, /movedToInactive|THIRTY_DAYS_MS/);
  assert.match(combined, /Your login remains active/);
});

test("submitted requests stay in admin attention until review", async () => {
  const dashboard = await source("components", "AdminPrayerDashboardClient.tsx");

  assert.match(dashboard, /r\.status === "Submitted"/);
  assert.match(dashboard, /status: request\.assigned_to \? "Assigned" : "Reviewed"/);
  assert.match(dashboard, /onClick=\{\(\) => approveRequest\(r\)\}/);
});
