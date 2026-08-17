import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("public community feeds use invoker wrappers over private filtered projections", async () => {
  const migration = await readFile(
    path.join(root, "supabase", "migrations", "20260817163259_secure_public_community_feeds.sql"),
    "utf8",
  );

  assert.match(migration, /create schema if not exists community_feed_private/);
  assert.match(migration, /revoke all on schema community_feed_private from public/);
  assert.match(migration, /create or replace view community_feed_private\.prayer_wall_data/);
  assert.match(migration, /create or replace view community_feed_private\.praise_wall_data/);
  assert.match(migration, /create or replace view community_feed_private\.testimonies_data/);
  assert.match(migration, /is_public is true/);
  assert.match(migration, /moderation_status = 'approved'/);
  assert.match(migration, /case when is_anonymous then null::text else name end/);
  assert.match(migration, /case when t\.is_anonymous then null::text else p\.full_name end/);
  assert.match(migration, /create or replace view public\.prayer_wall_public\s+with \(security_invoker = true, security_barrier = true\)/);
  assert.match(migration, /create or replace view public\.praise_wall_public\s+with \(security_invoker = true, security_barrier = true\)/);
  assert.match(migration, /create or replace view public\.testimonies_public\s+with \(security_invoker = true, security_barrier = true\)/);
  assert.doesNotMatch(migration, /grant select on table public\.(prayer_requests|praise_reports|testimonies|profiles)/);
});

test("Community Member policies no longer depend on the retired Prayer Care helper", async () => {
  const [migration, isolation] = await Promise.all([
    readFile(
      path.join(root, "supabase", "migrations", "20260817170000_replace_legacy_care_team_policies.sql"),
      "utf8",
    ),
    readFile(
      path.join(root, "supabase", "migrations", "20260817171000_isolate_community_admin_policy_helper.sql"),
      "utf8",
    ),
  ]);

  assert.match(migration, /create or replace function public\.is_community_admin\(\)/);
  assert.match(migration, /where id = auth\.uid\(\)\s+and role = 'admin'/);
  assert.match(migration, /create policy profiles_select_own_or_community_admin/);
  assert.match(migration, /auth\.uid\(\) = id/);
  assert.match(migration, /create policy prayer_activities_select_own_or_community_admin/);
  assert.match(migration, /create policy requests_select_community_admin/);
  assert.doesNotMatch(migration, /grant execute on function public\.is_care_team/);
  assert.doesNotMatch(migration, /delete from|truncate|drop table/i);
  assert.match(isolation, /create schema if not exists community_security/);
  assert.match(isolation, /create or replace function community_security\.is_admin\(\)/);
  assert.match(isolation, /alter policy profiles_select_own_or_community_admin/);
  assert.match(isolation, /revoke all on function public\.is_community_admin\(\)/);
  assert.doesNotMatch(isolation, /delete from|truncate|drop table/i);
});
