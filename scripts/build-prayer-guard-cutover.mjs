import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const migrationPath = resolve(root, "supabase/migrations/20261112090000_harden_prayer_request_member_guard.sql");
const rollbackPath = resolve(root, "supabase/release/prayer_request_owner_guard_rollback.sql");
const migration = await readFile(migrationPath, "utf8");
const rollback = await readFile(rollbackPath, "utf8");
const fileName = basename(migrationPath);
const match = fileName.match(/^(\d{14})_(.+)\.sql$/);
if (!match) throw new Error(`Unexpected migration filename: ${fileName}`);
const [, version, name] = match;
const sha256 = createHash("sha256").update(migration).digest("hex");
const expectedSha256 = "435e6f9d922d94a809a27487d774651b0ba97d916cc1629b838bb95f540a14a4";
if (sha256 !== expectedSha256) {
  throw new Error(`Migration fingerprint changed: ${sha256}`);
}
function dollarTag(base, ...contents) {
  let tag = base;
  while (contents.some((content) => content.includes(tag))) tag += "_";
  return tag;
}
const migrationTag = dollarTag("$lfp_migration_body$", migration);
const rollbackTag = dollarTag("$lfp_rollback_body$", rollback);

process.stdout.write([
  `-- Generated for ${fileName}; SHA-256 ${sha256}`,
  "-- This applies one exact reviewed migration and records its exact source version.",
  "BEGIN;",
  "DO $ledger_preflight$",
  "BEGIN",
  "  IF to_regclass('supabase_migrations.schema_migrations') IS NULL THEN",
  "    RAISE EXCEPTION 'Supabase migration history missing; refusing targeted cutover';",
  "  END IF;",
  `  IF EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '${version}') THEN`,
  `    RAISE EXCEPTION 'Migration version ${version} already recorded; refusing duplicate cutover';`,
  "  END IF;",
  "END $ledger_preflight$;",
  migration.trimEnd(),
  "INSERT INTO supabase_migrations.schema_migrations (version, statements, name, rollback)",
  `VALUES ('${version}', ARRAY[${migrationTag}${migration.trimEnd()}${migrationTag}], '${name}', ARRAY[${rollbackTag}${rollback.trimEnd()}${rollbackTag}]);`,
  "COMMIT;",
  "",
].join("\n"));