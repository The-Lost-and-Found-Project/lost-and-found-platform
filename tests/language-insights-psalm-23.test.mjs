import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
const source=(...p)=>readFile(path.join(process.cwd(),...p),"utf8");
test("Psalm 23 Language lesson teaches Hebrew poetry without lexical overreach",async()=>{
 const data=await source("lib","learning-lab","language","psalm-23.ts");
 assert.equal((data.match(/id:"/g)||[]).length,10);
 for(const term of ["nephesh","tsalmavet","ḥesed","shuv"])assert.match(data,new RegExp(term));
 assert.match(data,/Do not replace every occurrence of nephesh/);
 assert.match(data,/Do not turn the poetic phrase into a named biblical location/);
 assert.match(data,/No single English gloss captures every occurrence/);
});
test("Language lesson player is reusable across passage curricula",async()=>{
 const client=await source("components","learning-lab","LanguageLessonClient.tsx");
 const eph=await source("app","learn","language","ephesians-2-1-10","page.tsx");
 const psalm=await source("app","learn","language","psalm-23","page.tsx");
 assert.match(client,/lesson:LanguageLesson/);
 assert.match(eph,/lesson={ephesiansTwoLesson}/);
 assert.match(psalm,/lesson={psalmTwentyThreeLesson}/);
});
test("Language landing page offers both Greek epistle and Hebrew poetry lessons",async()=>{
 const page=await source("app","learn","language","page.tsx");
 assert.match(page,/Ephesians 2:1–10/);
 assert.match(page,/Psalm 23/);
 assert.match(page,/Hebrew poetry lesson/);
});
