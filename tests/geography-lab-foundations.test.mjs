import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
const source=(...p)=>readFile(path.join(process.cwd(),...p),"utf8");
test("Bible Geography teaches five ways place can clarify Scripture",async()=>{
 const data=await source("lib","learning-lab","geography","foundations.ts");
 assert.equal((data.match(/id:"/g)||[]).length,5);
 for(const skill of ["Water & livelihood","Hometown setting","Region & social boundary","Elevation & destination","Routes, cities & provinces"])assert.match(data,new RegExp(skill.replace("&","&")));
 assert.match(data,/Avoid exaggerating the divide/);
 assert.match(data,/Directional language can describe terrain/);
});
test("Bible Geography is active and rejects invented map symbolism",async()=>{
 const page=await source("app","learn","geography","page.tsx");
 const learn=await source("app","learn","page.tsx");
 assert.match(page,/We do not invent spiritual symbolism/);
 assert.match(page,/why the place matters/);
 assert.match(learn,/title:"Bible Geography"[\s\S]*active:true/);
});
