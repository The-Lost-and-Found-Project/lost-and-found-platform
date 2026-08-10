import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("push delivery is tracked and visible to administrators", async () => {
  const [migration, restriction, webhook, admin] = await Promise.all([
    source("supabase", "migrations", "20260810195945_harden_notification_delivery.sql"),
    source("supabase", "migrations", "20260810201500_restrict_notification_delivery_health.sql"),
    source("app", "api", "webhooks", "notification-created", "route.ts"),
    source("app", "admin", "page.tsx"),
  ]);

  assert.match(migration, /push_status text/);
  assert.match(migration, /notifications_push_status_check/);
  assert.match(migration, /notifications_push_attention_idx/);
  assert.match(webhook, /push_attempted_at/);
  assert.match(webhook, /push_delivered_at/);
  assert.match(webhook, /push_error/);
  assert.match(admin, /Notification delivery issues/);
  assert.match(migration, /get_notification_delivery_health/);
  assert.match(admin, /get_notification_delivery_health/);
  assert.match(admin, /const deliveryClient = createAdminClient\(\)/);
  assert.match(restriction, /security invoker/);
  assert.match(restriction, /grant execute[\s\S]*to service_role/);
  assert.match(restriction, /revoke all[\s\S]*from authenticated/);
});

test("private prayer details stay behind authenticated destinations", async () => {
  const [migration, staleCron, prayerEdit] = await Promise.all([
    source("supabase", "migrations", "20260810195945_harden_notification_delivery.sql"),
    source("app", "api", "cron", "notify-stale-assignments", "route.ts"),
    source("app", "api", "notify-prayer-edit", "route.ts"),
  ]);

  assert.doesNotMatch(migration, /left\(new\.request_text/);
  assert.doesNotMatch(staleCron, /request_text\.slice/);
  assert.match(prayerEdit, /type: "prayer_request_updated"/);
  assert.match(prayerEdit, /prayerRequest\.user_id !== user\.id/);
  assert.doesNotMatch(prayerEdit, /sendPushToUser/);
});

test("duplicate direct pushes are retired in favor of notification rows", async () => {
  const [signup, praise, application, applicationClient] = await Promise.all([
    source("app", "api", "notify-new-signup", "route.ts"),
    source("app", "api", "notify-new-praise-admin", "route.ts"),
    source("app", "api", "notify-prayer-care-application", "route.ts"),
    source("components", "PrayerCareApplicationClient.tsx"),
  ]);

  assert.doesNotMatch(signup, /sendPushToUsers/);
  assert.doesNotMatch(praise, /sendPushToUsers/);
  assert.doesNotMatch(application, /sendPushToUsers/);
  assert.match(application, /application_id: application\.id/);
  assert.match(applicationClient, /applicationId: application\.id/);
});

test("email preferences are enforced for role-related messages", async () => {
  const [assignment, edit, digest, praise, application] = await Promise.all([
    source("app", "api", "notify-assignment", "route.ts"),
    source("app", "api", "notify-prayer-edit", "route.ts"),
    source("app", "api", "cron", "weekly-digest", "route.ts"),
    source("app", "api", "notify-new-praise-admin", "route.ts"),
    source("app", "api", "notify-prayer-care-application", "route.ts"),
  ]);

  for (const route of [assignment, edit, digest, praise, application]) {
    assert.match(route, /email_notifications/);
  }
});

test("notification list explains urgency and the next action", async () => {
  const [notifications, page] = await Promise.all([
    source("components", "NotificationsClient.tsx"),
    source("app", "notifications", "page.tsx"),
  ]);
  assert.match(notifications, /Action needed/);
  assert.match(notifications, /Review overdue care/);
  assert.match(notifications, /Respond now/);
  assert.match(notifications, /Review assignment/);
  assert.match(notifications, /Priority/);
  assert.match(notifications, /follow_up_due/);
  assert.match(notifications, /prayer_escalated/);
  assert.match(notifications, /Care assignments, escalations, and due follow-ups/);
  assert.match(notifications, /role="group" aria-label="Notification view"/);
  assert.match(notifications, /h-11 w-11/);
  assert.match(page, /inline-flex min-h-11 items-center/);
});

test("due follow-ups create targeted, deduplicated care reminders", async () => {
  const staleCron = await source("app", "api", "cron", "notify-stale-assignments", "route.ts");

  assert.match(staleCron, /\.eq\("follow_up_needed", true\)/);
  assert.match(staleCron, /\.lte\("follow_up_date", today\)/);
  assert.match(staleCron, /type: "follow_up_due"/);
  assert.match(staleCron, /prayer_request_id: followUp\.id/);
  assert.match(staleCron, /recentReminderKeys/);
  assert.match(staleCron, /"\/prayer-assignments"/);
  assert.match(staleCron, /"\/admin"/);
  assert.doesNotMatch(staleCron, /request_text[\s\S]*follow_up_due/);
});

test("new escalations notify care owners and leaders without blocking the care update", async () => {
  const [adminUpdate, assignmentUpdate, alerts] = await Promise.all([
    source("app", "api", "admin", "prayer-requests", "update", "route.ts"),
    source("app", "api", "prayer-assignments", "update", "route.ts"),
    source("lib", "notifications", "care-alerts.ts"),
  ]);

  assert.match(adminUpdate, /previousRequest\.status !== "Escalated"/);
  assert.match(assignmentUpdate, /previousRequest\?\.status !== "Escalated"/);
  assert.match(adminUpdate, /catch \(notificationError\)/);
  assert.match(assignmentUpdate, /catch \(notificationError\)/);
  assert.match(alerts, /type: "prayer_escalated"/);
  assert.match(alerts, /\.in\("role", \["admin", "pastor"\]\)/);
  assert.match(alerts, /assignedTo !== actorUserId/);
  assert.doesNotMatch(alerts, /request_text|name|email|phone/);
});
