import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root=process.cwd();
const source=(...parts)=>readFile(path.join(root,...parts),"utf8");

test("Creator Studio reuses existing L&F publishing systems",async()=>{const creator=await source("app","admin","creator","page.tsx");assert.match(creator,/Creator Studio/);assert.match(creator,/content_catalog/);assert.match(creator,/bible_studies/);assert.match(creator,/ministry_content/);assert.match(creator,/reuses the systems already powering L&F/)});

test("Creator Studio routes into specialized publishing lanes",async()=>{const creator=await source("app","admin","creator","page.tsx");for(const href of ["/admin/library","/admin/studies","/admin/ministries","/admin/content","/discover","/library"])assert.match(creator,new RegExp(href.replaceAll("/","\\/")));assert.match(creator,/L&F Original/);assert.match(creator,/L&F Approved/);assert.match(creator,/Emmaus handoff/);assert.match(creator,/does not copy Emmaus into L&F/)});

test("Creator Studio is admin gated and linked from the Administration Center",async()=>{const [creator,admin]=await Promise.all([source("app","admin","creator","page.tsx"),source("app","admin","page.tsx")]);assert.match(creator,/getEffectiveRole/);assert.match(creator,/redirect\("\/dashboard"\)/);assert.match(admin,/href:"\/admin\/creator"/);assert.match(admin,/title:"Creator Studio"/);assert.match(admin,/Community Moderation/)});

test("Creator Studio does not introduce a duplicate backend or unrelated product integration",async()=>{const creator=await source("app","admin","creator","page.tsx");assert.doesNotMatch(creator,/createAdminClient|create table|migration|openai|anthropic/i);assert.doesNotMatch(creator,/rare of breed|rare network/i)});
