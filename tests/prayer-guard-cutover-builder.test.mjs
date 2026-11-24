import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = resolve(root, "supabase/migrations/20261112090000_harden_prayer_request_member_guard.sql");
const rollbackPath = resolve(root, "supabase/release/prayer_request_owner_guard_rollback.sql");
const builderPath = resolve(root, "scripts/build-prayer-guard-cutover.mjs");

test("targeted prayer guard cutover payload binds exact migration and rollback to one ledger version", () => {
  const migration = readFileSync(migrationPath, "utf8").trimEnd();
  const rollback = readFileSync(rollbackPath, "utf8").trimEnd();
  const output = execFileSync(process.execPath, [builderPath], { cwd: root, encoding: "utf8" });

  assert.match(output, /^-- Generated for 20261112090000_harden_prayer_request_member_guard\.sql; SHA-256 435e6f9d922d94a809a27487d774651b0ba97d916cc1629b838bb95f540a14a4/m);
  assert.ok(output.includes(migration), "payload must embed the exact reviewed migration body");
  assert.ok(output.includes(rollback), "ledger rollback payload must match the reviewed recovery SQL");
  assert.match(output, /BEGIN;[\s\S]*COMMIT;\s*$/);
  assert.match(output, /version = '20261112090000'/);
  assert.match(output, /VALUES \('20261112090000', ARRAY\[/);
  assert.match(output, /name='harden_prayer_request_member_guard'/);
});