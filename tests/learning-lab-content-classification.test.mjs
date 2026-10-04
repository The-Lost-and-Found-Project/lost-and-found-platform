import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
const source=(...parts)=>readFile(path.join(process.cwd(),...parts),"utf8");

test("Learning Lab classification preserves source questions while adding editorial disposition",async()=>{
 const migration=await source("supabase","migrations","20261004032000_classify_learning_lab_content.sql");
 for(const value of ["keep","move","rebuild","retire"])assert.match(migration,new RegExp("'"+value+"'"));
 for(const target of ["trivia","language","context","geography","connections","people","timeline","books","observation","study-skills"])assert.match(migration,new RegExp("'"+target+"'"));
 assert.match(migration,/does not change historical quiz data/);
 assert.doesNotMatch(migration,/delete from public\.trivia_questions/i);
});

test("Specialist legacy categories are moved or rebuilt rather than kept as trivia",async()=>{
 const migration=await source("supabase","migrations","20261004032000_classify_learning_lab_content.sql");
 assert.match(migration,/category_id='language-insights'/);
 assert.match(migration,/learning_lab_target='language'/);
 assert.match(migration,/category_id='bible-context'/);
 assert.match(migration,/learning_lab_target='context'/);
 assert.match(migration,/category_id='bible-geography'/);
 assert.match(migration,/learning_lab_target='geography'/);
 assert.match(migration,/category_id='connections'/);
 assert.match(migration,/learning_lab_target='connections'/);
});

test("Topical banks are not bulk blessed as factual trivia",async()=>{
 const migration=await source("supabase","migrations","20261004032000_classify_learning_lab_content.sql");
 assert.match(migration,/Topical banks are deliberately left unclassified/);
 assert.doesNotMatch(migration,/category_id in \('surrender','obedience'/);
});
