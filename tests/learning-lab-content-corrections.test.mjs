import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
const source=(...p)=>readFile(path.join(process.cwd(),...p),"utf8");

test("Learning Lab corrections explicitly narrow common overstatements",async()=>{
 const m=await source("supabase","migrations","20261004033500_learning_lab_content_corrections_1.sql");
 assert.match(m,/does not explicitly identify God as the third strand/);
 assert.match(m,/should not be treated as an unconditional guarantee/);
 assert.match(m,/not a promise that every personal plan will be approved/);
 assert.match(m,/addresses temptation specifically/);
});
test("Malachi 2 correction avoids a translation-sensitive slogan",async()=>{
 const m=await source("supabase","migrations","20261004033500_learning_lab_content_corrections_1.sql");
 assert.match(m,/What covenant failure does Malachi 2:14-16 confront/);
 assert.match(m,/Faithlessness toward one''s wife/);
 assert.match(m,/English translations differ on the exact wording of verse 16/);
 assert.match(m,/set status='draft'/);
});
