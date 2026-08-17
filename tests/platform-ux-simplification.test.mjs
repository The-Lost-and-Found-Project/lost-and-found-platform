import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("the dashboard restores an accessible scrolling prayer preview without restoring testimony duplication", async () => {
  const [prayers, ticker, testimonies] = await Promise.all([
    source("components", "PrayerWallTicker.tsx"),
    source("components", "TickerScroll.tsx"),
    source("components", "TestimonyTicker.tsx"),
  ]);

  assert.match(prayers, /\.limit\(12\)/);
  assert.match(prayers, /<TickerScroll heightClass="h-64">/);
  assert.match(prayers, /Open Prayer Wall/);
  assert.match(prayers, /aria-hidden=\{index >= requests\.length/);
  assert.match(prayers, /request_text\.slice\(0, 180\)/);
  assert.match(ticker, /prefers-reduced-motion: reduce/);
  assert.match(ticker, /pointerenter/);
  assert.match(ticker, /pointerleave/);
  assert.match(testimonies, /\.limit\(3\)/);
  assert.doesNotMatch(testimonies, /\.\.\.testimonies, \.\.\.testimonies/);
});

test("members manage their own prayer requests without an assignment workflow", async () => {
  const [page, client] = await Promise.all([
    source("app", "prayer", "my-requests", "page.tsx"),
    source("components", "MyPrayerRequestsClient.tsx"),
  ]);
  assert.match(page, /My Prayer Requests/);
  assert.match(client, /"edit" \| "resolve" \| "withdraw"/);
  assert.doesNotMatch(client, /assigned_to|careTeam|prayer partner/i);
});

test("admin navigation fits six destinations without horizontal scrolling", async () => {
  const navigation = await source("components", "BottomNav.tsx");

  assert.match(navigation, /grid-cols-6/);
  assert.doesNotMatch(navigation, /overflow-x-auto/);
});

test("user join dates are deterministic during hydration", async () => {
  const users = await source("components", "AdminUsersClient.tsx");

  assert.match(users, /formatJoinedDate/);
  assert.doesNotMatch(users, /new Date\(member\.created_at\)\.toLocaleDateString/);
});

test("admin attention view includes submitted and escalated requests", async () => {
  const requests = await source("components", "AdminPrayerDashboardClient.tsx");

  assert.match(requests, /request\.status === "Submitted"/);
  assert.match(requests, /request\.status === "Escalated"/);
  assert.doesNotMatch(requests, /Needs Reassignment/);
});

test("shared navigation and prayer-request actions meet mobile touch target sizing", async () => {
  const [header, backButton, notifications, account, requests] = await Promise.all([
    source("components", "Header.tsx"),
    source("components", "BackButton.tsx"),
    source("components", "NotificationBell.tsx"),
    source("components", "AuthControls.tsx"),
    source("components", "MyPrayerRequestsClient.tsx"),
  ]);

  assert.match(header, /aria-label="Send feedback"[^>]+h-11 w-11/);
  assert.match(backButton, /h-11 w-11/);
  assert.match(notifications, /relative flex h-11 w-11/);
  assert.match(account, /className="flex h-11 w-11 items-center justify-center/);
  assert.match(requests, /lfp-button/);
  assert.match(requests, /Mark Answered/);
});

test("community roadmap is preserved behind a compact accessible disclosure", async () => {
  const community = await source("app", "community", "page.tsx");

  assert.match(community, /<details/);
  assert.match(community, /<summary[^>]+min-h-14/);
  assert.match(community, /Mentoring and events/);
  assert.match(community, /systems, training, and safeguards/);
});

test("more page labels each group by purpose instead of repeating options", async () => {
  const more = await source("app", "more", "page.tsx");

  assert.doesNotMatch(more, /eyebrow="Options"/);
  assert.match(more, /eyebrow: "Your account"/);
  assert.match(more, /eyebrow: "Support and feedback"/);
  assert.match(more, /eyebrow: "About and help"/);
});

test("admin center puts prayer moderation before collapsed secondary tools", async () => {
  const admin = await source("app", "admin", "page.tsx");

  assert.ok(admin.indexOf("Request review") < admin.indexOf("Other administrative tools"));
  assert.match(admin, /<details className="lfp-card group mt-8/);
  assert.match(admin, /People, content, and analytics/);
  assert.doesNotMatch(admin, /Prayer Care Applications|Care queue/);
  assert.doesNotMatch(admin, /Private Founder Lab|\/emmaus/);
});

test("prayer administration exposes explicit attention and all-request views", async () => {
  const requests = await source("components", "AdminPrayerDashboardClient.tsx");

  assert.match(requests, /aria-label="Request queue"/);
  assert.match(requests, /Attention \(\{attentionCount\}\)/);
  assert.match(requests, /All \(\{requests\.length\}\)/);
  assert.match(requests, /setAttentionOnly\(false\)/);
  assert.match(requests, /statusFilter === "All"/);
  assert.match(requests, /role="status"/);
});
