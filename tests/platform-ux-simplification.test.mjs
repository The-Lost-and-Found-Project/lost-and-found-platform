import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("community previews use short unique excerpts instead of duplicated tickers", async () => {
  const [prayers, testimonies] = await Promise.all([
    source("components", "PrayerWallTicker.tsx"),
    source("components", "TestimonyTicker.tsx"),
  ]);

  assert.match(prayers, /\.limit\(3\)/);
  assert.match(testimonies, /\.limit\(3\)/);
  assert.doesNotMatch(prayers, /\.\.\.requests, \.\.\.requests/);
  assert.doesNotMatch(testimonies, /\.\.\.testimonies, \.\.\.testimonies/);
});

test("care-team completion does not declare a request answered", async () => {
  const assignments = await source("components", "MyPrayerAssignmentsClient.tsx");

  assert.match(assignments, /status: "Closed"/);
  assert.match(assignments, /without declaring the prayer answered/);
  assert.doesNotMatch(assignments, /answered: true,[\s\S]{0,80}status: "Resolved"/);
});

test("admin navigation fits six destinations without horizontal scrolling", async () => {
  const navigation = await source("components", "BottomNav.tsx");

  assert.match(navigation, /grid-cols-6/);
  assert.doesNotMatch(navigation, /overflow-x-auto/);
});

test("user join dates are deterministic during hydration", async () => {
  const users = await source("components", "AdminUsersClient.tsx");

  assert.match(users, /formatJoinedDate/);
  assert.doesNotMatch(users, /new Date\(u\.created_at\)\.toLocaleDateString/);
});

test("admin attention view includes reassignment and escalated care", async () => {
  const requests = await source("components", "AdminPrayerDashboardClient.tsx");

  assert.match(requests, /"Needs Reassignment", "Escalated"/);
});

test("shared navigation and journey actions meet mobile touch target sizing", async () => {
  const [header, backButton, notifications, account, journey] = await Promise.all([
    source("components", "Header.tsx"),
    source("components", "BackButton.tsx"),
    source("components", "NotificationBell.tsx"),
    source("components", "AuthControls.tsx"),
    source("components", "MyJourneyClient.tsx"),
  ]);

  assert.match(header, /aria-label="Send feedback"[^>]+h-11 w-11/);
  assert.match(backButton, /h-11 w-11/);
  assert.match(notifications, /relative flex h-11 w-11/);
  assert.match(account, /className="flex h-11 w-11 items-center justify-center/);
  assert.match(journey, /className="inline-flex min-h-11 items-center/);
  assert.match(journey, /Add To My Journey/);
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
