import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("prayer submissions use an authenticated server boundary", async () => {
  const [page, route, middleware] = await Promise.all([
    source("app", "prayer", "submit", "page.tsx"),
    source("app", "api", "prayer-requests", "submit", "route.ts"),
    source("lib", "supabase", "middleware.ts"),
  ]);

  assert.match(page, /fetch\("\/api\/prayer-requests\/submit"/);
  assert.doesNotMatch(page, /from\("prayer_requests"\)\.insert/);
  assert.doesNotMatch(page, /TurnstileWidget/);
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /profile\.is_active !== true/);
  assert.match(route, /`prayer-submission:\$\{user\.id\}`/);
  assert.match(route, /user_id: user\.id/);
  assert.match(route, /status: "Submitted"/);
  assert.match(middleware, /"\/prayer\/submit"/);
});

test("database access permits only active authenticated owners to insert prayers", async () => {
  const migration = await source(
    "supabase",
    "migrations",
    "20260816235837_secure_authenticated_prayer_submission.sql"
  );

  assert.match(migration, /revoke insert on table public\.prayer_requests from anon/);
  assert.match(migration, /for insert\s+to authenticated/);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /profiles\.is_active is true/);
  assert.doesNotMatch(migration, /to anon, authenticated/);
});
