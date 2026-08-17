import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("Praise Love is unique per Community Member and removable", async () => {
  const [migration, route, page] = await Promise.all([
    source("supabase", "migrations", "20260817000243_add_unique_praise_loves.sql"),
    source("app", "api", "praise-loves", "route.ts"),
    source("app", "praise", "page.tsx"),
  ]);

  assert.match(migration, /unique \(praise_report_id, user_id\)/);
  assert.match(migration, /for insert\s+to authenticated/);
  assert.match(migration, /for delete\s+to authenticated/);
  assert.match(migration, /profiles\.is_active is true/);
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /\.from\("praise_loves"\)[\s\S]*\.delete\(\)/);
  assert.match(route, /error\.code !== "23505"/);
  assert.match(page, /aria-pressed=\{lovedIds\.has\(selectedReport\.id\)\}/);
  assert.match(page, /disabled=\{pendingIds\.has\(selectedReport\.id\)\}/);
});
