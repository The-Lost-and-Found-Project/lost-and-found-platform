import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
const source=(...p)=>readFile(path.join(process.cwd(),...p),"utf8");
test("second Learning Lab correction batch separates text from popular inference",async()=>{
 const m=await source("supabase","migrations","20261004040500_learning_lab_content_corrections_2.sql");
 assert.match(m,/does not say that rain had never fallen/);
 assert.match(m,/not a universal formula promising every sufferer/);
 assert.match(m,/belongs first to that covenant setting/);
 assert.match(m,/first meaning is not a generic command/);
 assert.match(m,/John does not explicitly explain the scene that way/);
});
test("corrected questions teach the passage rather than the slogan",async()=>{
 const m=await source("supabase","migrations","20261004040500_learning_lab_content_corrections_2.sql");
 assert.match(m,/What did Noah do in response to God''s instructions/);
 assert.match(m,/what does the LORD promise to restore to His people after the locust devastation/);
 assert.match(m,/what new act does God tell Israel to watch for/);
 assert.match(m,/what commission does Jesus repeatedly give Peter/);
});
