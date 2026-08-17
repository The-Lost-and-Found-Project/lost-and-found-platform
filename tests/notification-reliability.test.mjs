import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("push delivery remains tracked and visible to administrators", async () => {
  const [migration, restriction, webhook, admin] = await Promise.all([
    source("supabase", "migrations", "20260810195945_harden_notification_delivery.sql"),
    source("supabase", "migrations", "20260810201500_restrict_notification_delivery_health.sql"),
    source("app", "api", "webhooks", "notification-created", "route.ts"),
    source("app", "admin", "page.tsx"),
  ]);
  assert.match(migration, /push_status text/);
  assert.match(migration, /notifications_push_attention_idx/);
  assert.match(webhook, /push_attempted_at/);
  assert.match(webhook, /push_delivered_at/);
  assert.match(admin, /Notification delivery issues/);
  assert.match(restriction, /grant execute[\s\S]*to service_role/);
  assert.match(restriction, /revoke all[\s\S]*from authenticated/);
});

test("prayer notifications now lead members to their own request list", async () => {
  const migration = await source("supabase", "migrations", "20260817005006_retire_prayer_care_architecture.sql");
  assert.match(migration, /'\/prayer\/my-requests'/);
  assert.match(migration, /Someone in the community prayed with you/);
  assert.doesNotMatch(migration, /left\(new\.request_text/);
});

test("legacy assignment notification endpoints are explicitly retired", async () => {
  for (const parts of [
    ["app", "api", "notify-assignment", "route.ts"],
    ["app", "api", "notify-prayer-edit", "route.ts"],
    ["app", "api", "notify-prayer-care-application", "route.ts"],
  ]) {
    const route = await source(...parts);
    assert.match(route, /retiredPrayerCareResponse/);
    assert.doesNotMatch(route, /sendPushToUser|resend\.emails\.send/);
  }
  const helper = await source("lib", "retired-prayer-care.ts");
  assert.match(helper, /status: 410/);
});

test("new praise notifications target administrators only", async () => {
  const praise = await source("app", "api", "notify-new-praise-admin", "route.ts");
  assert.match(praise, /\.eq\("role", "admin"\)/);
  assert.doesNotMatch(praise, /prayer_team|pastor/);
  assert.match(praise, /email_notifications/);
});

test("notification list explains meaningful community updates and retains legacy history", async () => {
  const [notifications, page] = await Promise.all([
    source("components", "NotificationsClient.tsx"),
    source("app", "notifications", "page.tsx"),
  ]);
  assert.match(notifications, /Legacy notice/);
  assert.match(notifications, /Open Prayer/);
  assert.match(notifications, /Important moderation and account updates/);
  assert.match(notifications, /role="group" aria-label="Notification view"/);
  assert.match(notifications, /h-11 w-11/);
  assert.match(page, /inline-flex min-h-11 items-center/);
});

test("retired scheduled work no longer consumes recurring invocations", async () => {
  const [config, staleCron] = await Promise.all([
    source("vercel.json"),
    source("app", "api", "cron", "notify-stale-assignments", "route.ts"),
  ]);
  assert.doesNotMatch(config, /notify-stale-assignments|publish-devotion-week|weekly-digest/);
  assert.match(config, /archive-stale-requests/);
  assert.match(staleCron, /retired: true/);
});

test("prayer moderation updates no longer assign or reassign members", async () => {
  const [adminUpdate, dashboard] = await Promise.all([
    source("app", "api", "admin", "prayer-requests", "update", "route.ts"),
    source("components", "AdminPrayerDashboardClient.tsx"),
  ]);
  assert.doesNotMatch(adminUpdate, /assigned_to|notifyPrayerEscalation/);
  assert.doesNotMatch(dashboard, /careTeam|Assignee|assigned_to/);
  assert.match(dashboard, /Requests are not assigned to individual members/);
});
