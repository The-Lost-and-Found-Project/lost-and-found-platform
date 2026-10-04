import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
const source=(...p)=>readFile(path.join(process.cwd(),...p),"utf8");
test("third correction batch restores promise passages to context",async()=>{
 const m=await source("supabase","migrations","20261004043500_learning_lab_content_corrections_3.sql");
 for(const phrase of ["Judean exiles","song of thanksgiving","restoration to Zion","restoration oracle for Zion","conforming them to the image of His Son","content in both plenty and hunger"]) assert.match(m,new RegExp(phrase));
});
test("third correction batch retires redundant learning objectives without deleting history",async()=>{
 const m=await source("supabase","migrations","20261004043500_learning_lab_content_corrections_3.sql");
 const drafts=(m.match(/set status='draft'/g)||[]).length;
 assert.equal(drafts,4);
 assert.doesNotMatch(m,/delete from public\.trivia_questions/i);
 assert.match(m,/Preserve historical attempts/);
});
