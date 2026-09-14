import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root=process.cwd();
const source=(...parts)=>readFile(path.join(root,...parts),"utf8");

test("Creator Studio reuses existing L&F publishing systems",async()=>{const creator=await source("app","admin","creator","page.tsx");assert.match(creator,/Creator Studio/);assert.match(creator,/content_catalog/);assert.match(creator,/bible_studies/);assert.match(creator,/ministry_content/);assert.match(creator,/Editorial administration remains separate from ministry facilitation/)});

test("Creator Studio routes into specialized publishing lanes",async()=>{const creator=await source("app","admin","creator","page.tsx");for(const href of ["/admin/library","/facilitator/studies","/admin/ministries","/admin/content"])assert.match(creator,new RegExp(href.replaceAll("/","\\/")));assert.match(creator,/Facilitator Study Center/);assert.match(creator,/ministry-scoped facilitator access/)});

test("Creator Studio remains admin gated",async()=>{const [creator,admin]=await Promise.all([source("app","admin","creator","page.tsx"),source("app","admin","page.tsx")]);assert.match(creator,/getEffectiveRole/);assert.match(creator,/redirect\("\/dashboard"\)/);assert.match(admin,/href:"\/admin\/creator"/);assert.match(admin,/title:"Creator Studio"/)});

test("Creator Studio does not introduce unrelated product integration",async()=>{const creator=await source("app","admin","creator","page.tsx");assert.doesNotMatch(creator,/rare of breed|rare network/i)});
