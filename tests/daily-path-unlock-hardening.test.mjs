import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("Daily Path server actions reject unreleased or future days",()=>{
 const actions=read("app/study-path/[sessionId]/[day]/actions.ts");
 assert.match(actions,/assertDailyPathAccess/);
 assert.match(actions,/daily_path_released_at/);
 assert.match(actions,/Math\.floor\(\(nowMs-releaseMs\)\/86400000\)\+1/);
 assert.match(actions,/if\(day>unlocked\)throw new Error\("That Daily Path day is not available yet\."\)/);
 for(const action of ["savePrivateJournal","lockGroupResponse","savePersonalReflection","completeDailyStudy"]){
  const start=actions.indexOf(`export async function ${action}`);
  assert.ok(start>=0,`${action} exists`);
  const next=actions.indexOf("export async function",start+1);
  const body=actions.slice(start,next<0?actions.length:next);
  assert.match(body,/assertDailyPathAccess\(s,user\.id,sessionId,day\)/,`${action} checks unlock state`);
 }
});

test("Daily Path RLS enforces unlock timing for writes and progress",()=>{
 const migration=read("supabase/migrations/20260929235000_harden_daily_path_unlocks.sql");
 assert.match(migration,/create or replace function public\.is_daily_path_day_unlocked/);
 assert.match(migration,/now\(\) >= ss\.daily_path_released_at/);
 assert.match(migration,/jsonb_array_length\(bs\.devotional_cards\)/);
 assert.match(migration,/participants manage own unlocked daily progress/);
 assert.match(migration,/participants insert own unlocked daily responses/);
 assert.match(migration,/participants update own unlocked responses/);
 assert.match(migration,/participants read unlocked own or revealed group responses/);
 const occurrences=(migration.match(/is_daily_path_day_unlocked\(/g)||[]).length;
 assert.ok(occurrences>=7,"unlock helper is applied across read/write/progress policies");
});
