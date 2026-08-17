import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("authors cannot react to their own Community submissions", async () => {
  const [migration, prayerRoute, praiseRoute, testimonyRoute] = await Promise.all([
    source("supabase", "migrations", "20260817203000_add_safe_community_reactions.sql"),
    source("app", "api", "prayer-activities", "route.ts"),
    source("app", "api", "praise-loves", "route.ts"),
    source("app", "api", "testimony-encouragements", "route.ts"),
  ]);

  assert.match(migration, /prayer_requests\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /praise_reports\.user_id is distinct from \(select auth\.uid\(\)\)/);
  assert.match(migration, /testimonies\.user_id is distinct from \(select auth\.uid\(\)\)/);
  for (const route of [prayerRoute, praiseRoute, testimonyRoute]) {
    assert.match(route, /\.select\("id, is_own"\)/);
    assert.match(route, /\.is_own/);
    assert.match(route, /cannot react to your own/);
  }
});

test("Praise and Testimony reactions notify authors once without naming reactors", async () => {
  const migration = await source(
    "supabase",
    "migrations",
    "20260817203000_add_safe_community_reactions.sql"
  );

  assert.match(migration, /create unique index if not exists notifications_unique_community_reaction/);
  assert.match(migration, /create or replace function public\.notify_praise_love\(\)/);
  assert.match(migration, /create or replace function public\.notify_testimony_encouragement\(\)/);
  assert.match(migration, /'praise_loved'/);
  assert.match(migration, /'testimony_encouraged'/);
  assert.match(migration, /on conflict do nothing/);
  assert.doesNotMatch(migration, /full_name.*notify_praise_love|full_name.*notify_testimony_encouragement/s);
});

test("Testimony encouragement is unique, removable, and represented in the ticker", async () => {
  const [migration, route, ticker] = await Promise.all([
    source("supabase", "migrations", "20260817203000_add_safe_community_reactions.sql"),
    source("app", "api", "testimony-encouragements", "route.ts"),
    source("components", "TestimonyTicker.tsx"),
  ]);

  assert.match(migration, /unique \(testimony_id, user_id\)/);
  assert.match(route, /\.from\("testimony_encouragements"\)[\s\S]*\.delete\(\)/);
  assert.match(route, /error\.code !== "23505"/);
  assert.match(ticker, /aria-pressed=\{encouragedIds\.has\(selectedTestimony\.id\)\}/);
  assert.match(ticker, /This encouraged me/);
});

test("Notifications remain in primary navigation but not the account dropdown", async () => {
  const [accountMenu, bottomNav, memberGuide, notificationList] = await Promise.all([
    source("components", "AuthControls.tsx"),
    source("components", "BottomNav.tsx"),
    source("app", "help", "manual", "member", "page.tsx"),
    source("components", "NotificationsClient.tsx"),
  ]);

  assert.doesNotMatch(accountMenu, /href:\s*"\/notifications"/);
  assert.match(bottomNav, /href:\s*"\/notifications"/);
  assert.match(memberGuide, /You cannot react to your own prayer request/);
  assert.match(memberGuide, /You cannot Love your own praise report/);
  assert.match(memberGuide, /You cannot encourage your own testimony/);
  assert.match(notificationList, /praise_loved: \{ label: "Praise"/);
  assert.match(notificationList, /testimony_encouraged: \{ label: "Testimony"/);
});
