import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("Platform 2.0 preserves the former standalone product source while integrating approved experiences", async () => {
  const [boundary, dashboard, discover, staging] = await Promise.all([
    source("lib", "standalone-products.ts"),
    source("app", "dashboard", "page.tsx"),
    source("app", "discover", "page.tsx"),
    source("standalone-products", "README.md"),
  ]);

  assert.match(boundary, /emmaus|trivia|devotions/i);
  assert.match(dashboard, /Continue Emmaus/);
  assert.match(dashboard, /Daily Bible challenge/);
  assert.match(dashboard, /Devotional/);
  assert.match(discover, /Study/);
  assert.match(discover, /Devotions/);
  assert.match(discover, /Trivia/);
  assert.match(staging, /preserves the route and API source/);
  assert.match(staging, /Do not delete this staging source or its Supabase data/);
});

test("historical separation migrations remain non-destructive and auditable", async () => {
  const [migration, isolation, config] = await Promise.all([
    source("supabase", "migrations", "20260817020000_separate_standalone_products.sql"),
    source("supabase", "migrations", "20260817021000_isolate_standalone_product_functions.sql"),
    source("vercel.json"),
  ]);

  assert.match(migration, /update public\.notifications/);
  assert.doesNotMatch(migration, /delete from|drop table|drop function|storage\.objects/i);
  assert.match(isolation, /p\.proname like '%emmaus%'/);
  assert.match(isolation, /revoke all on function %s from public, anon, authenticated/);
  assert.match(isolation, /grant execute on function %s to service_role/);
  assert.doesNotMatch(isolation, /drop function|delete from|truncate/i);
  assert.doesNotMatch(config, /publish-devotion-week/);
});

test("legacy John 1 graph writer remains reserved for trusted service-role use", async () => {
  const migration = await source(
    "supabase",
    "migrations",
    "20260817163404_isolate_attach_john_1_semantics.sql",
  );

  assert.match(migration, /revoke all on function public\.attach_john_1_semantics\(text\)/);
  assert.match(migration, /from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.attach_john_1_semantics\(text\)\s+to service_role/);
});
