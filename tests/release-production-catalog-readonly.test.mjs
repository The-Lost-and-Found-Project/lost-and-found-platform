import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync("docs/release/lfp-production-catalog-readonly.sql", "utf8");
const uncommented = sql.split("\n").filter((line) => !/^\s*--/.test(line)).join("\n");

test("catalog report contains no write or execution statements", () => {
  for (const operation of [
    "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "TRUNCATE",
    "GRANT", "REVOKE", "CALL", "EXECUTE", "COPY", "DO",
  ]) {
    assert.doesNotMatch(uncommented, new RegExp("^\\s*" + operation + "\\b", "im"),
      operation + " must never be run by the report");
  }
  assert.match(uncommented, /^\s*WITH\s+required_notification_columns/i);
  assert.match(uncommented, /SELECT\s+\n?\s*'LFP_PR178_READ_ONLY_CATALOG_V1'/i);
  assert.match(uncommented, /false AS release_authorized/i);
  assert.doesNotMatch(uncommented, /auth\.users\s*(?:u|where|join)/i);
  assert.doesNotMatch(uncommented, /giving_transactions\s*(?:gt|where|join)/i);
});

test("report explicitly fails closed before #183 corrective release gate is installed", () => {
  assert.match(uncommented, /correction_version_registered/);
  assert.match(uncommented, /unlock_helper_exists AND NOT anon_can_execute_unlock_helper/);
  assert.match(uncommented, /unlock_helper_has_fixed_search_path/);
  assert.match(uncommented, /correct_study_policy_inventory/);
  assert.match(uncommented, /release_versions_registered=0/);
  assert.match(uncommented, /NOT new_ministry_fanout_present/);
});

test("report detects unexpected extra permissive policies, not just named matches", () => {
  assert.match(uncommented, /progress_count=1 AND responses_count=3 AND strict_policies=4/);
  assert.match(uncommented, /roles=ARRAY\['authenticated'\]::name\[\]/);
  assert.match(uncommented, /permissive='PERMISSIVE'/);
  assert.match(uncommented, /with_check ILIKE '%is_daily_path_day_unlocked%'/);
  assert.match(uncommented, /qual ILIKE '%is_daily_path_day_unlocked%'/);
});

test("report checks original push trigger, notification RLS and 20 column types", () => {
  assert.match(uncommented, /tgname='notification_created_push' AND tgenabled='O'/);
  assert.match(uncommented, /notifications_rls_enabled/);
  assert.match(uncommented, /missing_notification_columns=0/);
  assert.match(uncommented, /member_can_update_push_status/);
  const cols = sql.slice(
    sql.indexOf("required_notification_columns("),
    sql.indexOf("required_tables(")
  );
  assert.equal((cols.match(/\('[a-z_]+','(?:uuid|text|timestamptz)'\)/g) || []).length, 20);
});
