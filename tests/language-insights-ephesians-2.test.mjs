import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
const source=(...parts)=>readFile(path.join(process.cwd(),...parts),"utf8");

test("Ephesians 2 Language lesson is passage-first and has ten natural questions",async()=>{
 const data=await source("lib","learning-lab","language","ephesians-2-1-10.ts");
 assert.match(data,/Ephesians 2:1–10/);
 const ids=(data.match(/id:"/g)||[]).length;
 assert.equal(ids,10);
 for(const term of ["peripateō","aiōn","eleos","charis","sōzō","dōron","ergon","poiēma","ktizō","proetoimazō"])assert.match(data,new RegExp(term));
});
test("Language lesson includes anti-overstatement guardrails",async()=>{
 const data=await source("lib","learning-lab","language","ephesians-2-1-10.ts");
 assert.match(data,/verse does not literally call believers God's poem/);
 assert.match(data,/Do not make dōron carry more grammatical weight/);
});
test("Language landing page links to the passage lesson",async()=>{
 const page=await source("app","learn","language","page.tsx");
 assert.match(page,/\/learn\/language\/ephesians-2-1-10/);
 assert.match(page,/Ten language questions drawn naturally/);
});
