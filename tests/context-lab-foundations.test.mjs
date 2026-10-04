import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
const source=(...p)=>readFile(path.join(process.cwd(),...p),"utf8");
test("Context Lab teaches five distinct context skills with application",async()=>{
 const data=await source("lib","learning-lab","context","foundations.ts");
 assert.equal((data.match(/id:"/g)||[]).length,5);
 for(const skill of ["Genre","Identity & covenant","Culture","Literary flow","Genre & allusion"])assert.match(data,new RegExp(skill.replace("&","&")));
 assert.match(data,/Individual proverbs normally describe wise patterns/);
 assert.match(data,/Modern chapter and verse numbers are useful navigation tools/);
 assert.match(data,/before jumping to modern events/);
});
test("Context Lab is active and keeps background subordinate to Scripture",async()=>{
 const learn=await source("app","learn","page.tsx");
 const page=await source("app","learn","context","page.tsx");
 assert.match(learn,/title:"Context Lab"[\s\S]*active:true/);
 assert.match(page,/Background information serves Scripture; it does not control Scripture/);
 assert.match(page,/Use the skill in Emmaus/);
});
