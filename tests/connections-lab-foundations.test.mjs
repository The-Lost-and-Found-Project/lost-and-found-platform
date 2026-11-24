import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
const source=(...p)=>readFile(path.join(process.cwd(),...p),"utf8");
test("Connections Lab grades textual connections instead of flattening them",async()=>{
 const data=await source("lib","learning-lab","connections","foundations.ts");
 assert.equal((data.match(/id:"/g)||[]).length,5);
 for(const kind of ["Explicit quotation","Explicit comparison","Author-developed argument","Narrative pattern"])assert.match(data,new RegExp(kind));
 assert.match(data,/confidence:"Explicit"/);
 assert.match(data,/confidence:"Strong textual pattern"/);
 assert.match(data,/responsible inference, not the same category as an explicit quotation/);
});
test("Connections Lab requires evidence and distinguishes similarity from fulfillment",async()=>{
 const page=await source("app","learn","connections","page.tsx");
 const learn=await source("app","learn","page.tsx");
 assert.match(page,/evidence, not imagination/);
 assert.match(page,/Similarity is not automatically fulfillment/);
 assert.match(learn,/title:"Connections"[\s\S]*active:true/);
});
