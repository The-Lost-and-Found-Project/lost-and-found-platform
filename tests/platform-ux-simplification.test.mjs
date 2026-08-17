import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("community previews use a consistent two-line pattern with accessible full views", async () => {
  const [prayers, ticker, testimonies, card, detail, prayerPage, praisePage] = await Promise.all([
    source("components", "PrayerWallTicker.tsx"),
    source("components", "TickerScroll.tsx"),
    source("components", "TestimonyTicker.tsx"),
    source("components", "CommunityTickerCard.tsx"),
    source("components", "CommunityDetailDialog.tsx"),
    source("app", "prayer", "page.tsx"),
    source("app", "praise", "page.tsx"),
  ]);

  assert.match(prayers, /\.limit\(12\)/);
  assert.match(prayers, /<TickerScroll heightClass="h-64">/);
  assert.match(prayers, /Open Prayer/);
  assert.match(prayers, /aria-hidden=\{duplicate/);
  assert.match(prayers, /line-clamp-2/);
  assert.match(prayers, /tabIndex=\{duplicate \? -1 : 0\}/);
  assert.match(ticker, /prefers-reduced-motion: reduce/);
  assert.match(ticker, /pointerenter/);
  assert.match(ticker, /pointerleave/);
  assert.match(testimonies, /\.limit\(3\)/);
  assert.match(testimonies, /showAll/);
  assert.doesNotMatch(testimonies, /\.\.\.testimonies, \.\.\.testimonies/);
  assert.match(card, /line-clamp-2/);
  assert.match(card, /Open full \$\{label\}/);
  assert.match(detail, /aria-modal="true"/);
  assert.match(detail, /z-\[100\]/);
  assert.match(detail, /max-h-\[92dvh\]/);
  assert.match(detail, /overflow-y-auto/);
  assert.match(detail, /event\.key === "Escape"/);
  assert.match(detail, /previouslyFocused\?\.focus\(\)/);
  assert.match(prayerPage, /CommunityTickerCard/);
  assert.match(prayerPage, /CommunityDetailDialog/);
  assert.match(praisePage, /CommunityTickerCard/);
  assert.match(praisePage, /CommunityDetailDialog/);
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
  const [requests, distribution, admin] = await Promise.all([
    source("components", "AdminPrayerDashboardClient.tsx"),
    source("lib", "prayer-distribution.ts"),
    source("app", "admin", "page.tsx"),
  ]);

  assert.match(requests, /request\.status === "Submitted"/);
  assert.match(requests, /request\.status === "Escalated"/);
  assert.match(requests, /needsPrayerExposure\(request\)/);
  assert.match(requests, /Needs prayer exposure/);
  assert.match(distribution, /request\.prayer_count <= 1/);
  assert.match(distribution, /request\.is_public === true/);
  assert.match(admin, /Needs prayer exposure/);
  assert.doesNotMatch(requests, /Needs Reassignment/);
});

test("Prayer distribution brings under-supported active requests forward without public vanity counts", async () => {
  const [page, ticker, distribution] = await Promise.all([
    source("app", "prayer", "page.tsx"),
    source("components", "PrayerWallTicker.tsx"),
    source("lib", "prayer-distribution.ts"),
  ]);

  for (const sourceText of [page, ticker]) {
    assert.match(sourceText, /\.not\("status", "in", CLOSED_PRAYER_STATUS_FILTER\)/);
    assert.match(sourceText, /\.order\("prayer_count", \{ ascending: true \}\)/);
    assert.match(sourceText, /\.order\("created_at", \{ ascending: true \}\)/);
  }
  assert.match(page, /prayerSupportLabel/);
  assert.doesNotMatch(page, /`\$\{request\.prayer_count\} \$\{request\.prayer_count === 1/);
  assert.match(distribution, /Waiting for prayer/);
  assert.match(distribution, /Someone is carrying this in prayer/);
  assert.match(distribution, /People are carrying this in prayer/);
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
