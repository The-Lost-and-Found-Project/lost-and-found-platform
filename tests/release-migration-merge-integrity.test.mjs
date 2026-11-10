import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expected } from "../scripts/check-release-migration-scope.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const prerequisite = "20261110224156_restore_daily_path_release_gate.sql";

function withFixture(fn) {
  const tmp = mkdtempSync(join(tmpdir(), "lfp-release-scope-"));
  const migrationDir = join(tmp, "supabase", "migrations");
  const scriptDir = join(tmp, "scripts");
  try {
    mkdirSync(migrationDir, { recursive: true });
    mkdirSync(scriptDir, { recursive: true });
    copyFileSync(join(root, "scripts", "check-release-migration-scope.mjs"),
      join(scriptDir, "check-release-migration-scope.mjs"));
    for (const [name] of expected) {
      copyFileSync(join(root, "supabase", "migrations", name), join(migrationDir, name));
    }
    return fn(tmp, migrationDir);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function runCheck(cwd) {
  return spawnSync(process.execPath, ["scripts/check-release-migration-scope.mjs"], {
    cwd, encoding: "utf8", timeout: 10000,
  });
}

test("only the exact eight release migrations are valid before #182 merges", () => {
  withFixture((cwd) => assert.equal(runCheck(cwd).status, 0));
});

test("a corrupted or substituted #182 corrective migration is always rejected", () => {
  withFixture((cwd, dir) => {
    writeFileSync(join(dir, prerequisite), "-- counterfeit correction\n");
    const result = runCheck(cwd);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Migration changed without review/);
  });
});

test("unrelated November SQL is still rejected even when eight hashes match", () => {
  withFixture((cwd, dir) => {
    writeFileSync(join(dir, "20261110999999_unreviewed.sql"), "SELECT 1;\n");
    const result = runCheck(cwd);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Unexpected November migration file or version/);
  });
});

test("a real #182 merge file is accepted only if its reviewed checksum matches", () => {
  const source = join(root, "supabase", "migrations", prerequisite);
  if (!existsSync(source)) return; // This file joins the merge tree after PR #183.
  withFixture((cwd, dir) => {
    copyFileSync(source, join(dir, prerequisite));
    assert.equal(runCheck(cwd).status, 0);
  });
});
