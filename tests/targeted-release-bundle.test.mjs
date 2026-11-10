import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const sql=execFileSync(process.execPath,["scripts/print-targeted-release-bundle.mjs"],{
 cwd:root,encoding:"utf8",timeout:10000,maxBuffer:2_000_000
});
const expected=[
 "20261105170653","20261105173628","20261105174247","20261105182138",
 "20261105195229","20261110153802","20261110181936","20261110194736"
];

test("targeted bundle has one transaction around exactly eight reviewed scripts",()=>{
 assert.equal((sql.match(/^BEGIN;$/gm)||[]).length,1);
 assert.equal((sql.match(/^COMMIT;$/gm)||[]).length,1);
 assert.ok(sql.indexOf("BEGIN;")<sql.indexOf("BEGIN REVIEWED MIGRATION"));
 assert.ok(sql.lastIndexOf("END REVIEWED MIGRATION")<sql.lastIndexOf("COMMIT;"));
 assert.deepEqual([...sql.matchAll(/^-- BEGIN REVIEWED MIGRATION: (\d{14})_/gm)]
   .map(m=>m[1]),expected);
 assert.equal((sql.match(/^-- SHA256: [a-f0-9]{64}$/gm)||[]).length,8);
});

test("bundle refuses replayed migration versions before DDL begins",()=>{
 assert.match(sql,/Release preflight: a November migration version is already registered/);
 assert.match(sql,/supabase_migrations\.schema_migrations/);
 assert.match(sql,/pg_advisory_xact_lock/);
 for(const v of expected)assert.ok(sql.includes("'"+v+"'"));
});

test("bundle preserves existing webhook and verifies notification grants",()=>{
 assert.match(sql,/notification_created_push/);
 assert.match(sql,/ministry_publication_notifications/);
 assert.match(sql,/Release postflight: notification update grant wrong/);
 assert.match(sql,/has_column_privilege\('authenticated','public\.notifications','push_status','UPDATE'\)/);
});

test("bundle does not silently mark migration history or run a network operation",()=>{
 assert.doesNotMatch(sql,/^\s*(?:insert|update|delete)\s+(?:into\s+|from\s+)?supabase_migrations\.schema_migrations/im);
 assert.match(sql,/History is NOT automatically repaired/);
});


test("bundle aborts before migration grants if hosted Daily Path release locks are missing",()=>{
 const firstMigration=sql.indexOf("-- BEGIN REVIEWED MIGRATION:");
 const gate=sql.indexOf("Release preflight: Daily Path unlock policies absent or unsafe (#182)");
 assert.ok(gate>0 && gate<firstMigration,"legacy policies must be rejected before any DDL");
 const preflight=sql.slice(0,firstMigration);
 assert.match(preflight,/to_regprocedure\('public\.is_daily_path_day_unlocked\(uuid,uuid,integer\)'\) IS NULL/);
 for(const policy of [
  "participants manage own unlocked daily progress",
  "participants insert own unlocked daily responses",
  "participants update own unlocked responses",
  "participants read unlocked own or revealed group responses"
 ])assert.ok(preflight.includes(policy),"missing strict policy preflight: "+policy);
 assert.ok((preflight.match(/ILIKE '%is_daily_path_day_unlocked%'/g)||[]).length>=6,
  "gate must verify the actual policy expressions, not names alone");
});

test("bundle rejects additive permissive RLS policy combinations",()=>{
 const firstMigration=sql.indexOf("-- BEGIN REVIEWED MIGRATION:");
 const preflight=sql.slice(0,firstMigration);
 assert.match(preflight,/unexpected Daily Path policies may bypass release lock \(#182\)/);
 assert.match(preflight,/tablename='study_daily_progress'\) <> 1/);
 assert.match(preflight,/tablename='study_daily_responses'\) <> 3/);
 assert.ok(preflight.indexOf("unexpected Daily Path policies") <
   preflight.indexOf("Release preflight: Daily Path unlock policies"),
   "extra-policy rejection must occur before gate can be treated as passed");
});
