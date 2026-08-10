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
