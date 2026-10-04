import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
const source=(...p)=>readFile(path.join(process.cwd(),...p),"utf8");
test("deduplication operates by learning objective rather than verse alone",async()=>{
 const m=await source("supabase","migrations","20261004050500_deduplicate_learning_lab_objectives_1.sql");
 assert.match(m,/Hebrews 12:1 contains distinct facts/);
 assert.match(m,/great-cloud-of-witnesses objective/);
 assert.match(m,/weight-and-sin objective/);
 assert.match(m,/duplicate of the reviewed Hebrews 11:1 learning objective/);
});
test("deduplication improves context and avoids traditional labels as biblical titles",async()=>{
 const m=await source("supabase","migrations","20261004050500_deduplicate_learning_lab_objectives_1.sql");
 assert.match(m,/necessities named in the surrounding paragraph/);
 assert.match(m,/“Doubting Thomas” is a later nickname, not a biblical title/);
 assert.match(m,/rather than treating every narrative detail as a one-to-one allegorical definition/);
});
