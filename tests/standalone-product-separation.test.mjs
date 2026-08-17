import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("Community App centrally retires standalone product pages and APIs", async () => {
  const [boundary, middleware, admin] = await Promise.all([
    source("lib", "standalone-products.ts"),
    source("lib", "supabase", "middleware.ts"),
    source("app", "admin", "page.tsx"),
  ]);

  for (const route of [
    "/emmaus",
    "/trivia",
    "/devotions",
    "/admin/trivia",
    "/admin/devotions",
    "/grow",
    "/api/emmaus",
    "/api/admin/trivia",
    "/api/admin/devotions",
    "/api/cron/publish-devotion-week",
  ]) {
    assert.match(boundary, new RegExp(route.replaceAll("/", "\\/")));
  }

  assert.match(middleware, /status: 410/);
  assert.match(middleware, /Cache-Control.*no-store/);
  assert.match(middleware, /url\.hash = "separate-products"/);
  assert.doesNotMatch(admin, /\/emmaus|\/admin\/trivia|\/admin\/devotions/);

  const appEntries = await readdir(path.join(root, "app"));
  assert.ok(!appEntries.includes("emmaus"));
  assert.ok(!appEntries.includes("trivia"));
  assert.ok(!appEntries.includes("devotions"));
  await assert.rejects(source("app", "grow", "page.tsx"), { code: "ENOENT" });

  const adminEntries = await readdir(path.join(root, "app", "admin"));
  assert.ok(!adminEntries.includes("trivia"));
  assert.ok(!adminEntries.includes("devotions"));
});

test("separation messaging is explicit and product data remains represented", async () => {
  const [programs, inventory, migration, isolation, config, staging] = await Promise.all([
    source("app", "programs", "page.tsx"),
    source("docs", "community-rebuild-dependency-inventory.md"),
    source("supabase", "migrations", "20260817020000_separate_standalone_products.sql"),
    source("supabase", "migrations", "20260817021000_isolate_standalone_product_functions.sql"),
    source("vercel.json"),
    source("standalone-products", "README.md"),
  ]);

  for (const product of ["EMAS / Emmaus", "Bible Trivia", "Devotions"]) {
    assert.match(programs, new RegExp(product.replace("/", "\\/")));
  }
  assert.match(programs, /Moving, not discontinued/);
  assert.match(programs, /content and member progress are safely preserved/i);
  assert.match(inventory, /31,102 Scripture nodes/);
  assert.match(inventory, /550 questions/);
  assert.match(inventory, /21 audio objects/);
  assert.match(migration, /update public\.notifications/);
  assert.doesNotMatch(migration, /delete from|drop table|drop function|storage\.objects/i);
  assert.match(isolation, /p\.proname like '%emmaus%'/);
  assert.match(isolation, /revoke all on function %s from public, anon, authenticated/);
  assert.match(isolation, /grant execute on function %s to service_role/);
  assert.doesNotMatch(isolation, /drop function|delete from|truncate/i);
  assert.doesNotMatch(config, /publish-devotion-week/);
  assert.match(staging, /preserves the route and API source/);
  assert.match(staging, /Do not delete this staging source or its Supabase data/);
});

test("legacy John 1 graph writer is reserved for trusted standalone-product extraction", async () => {
  const migration = await source(
    "supabase",
    "migrations",
    "20260817163404_isolate_attach_john_1_semantics.sql",
  );

  assert.match(migration, /revoke all on function public\.attach_john_1_semantics\(text\)/);
  assert.match(migration, /from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.attach_john_1_semantics\(text\)\s+to service_role/);
});
