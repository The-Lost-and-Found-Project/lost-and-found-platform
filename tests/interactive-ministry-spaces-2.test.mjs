import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root=process.cwd();
const source=(...parts)=>readFile(path.join(root,...parts),"utf8");

test("ministry spaces are data driven and participatory",async()=>{const hub=await source("lib","ministry-hub.ts");const page=await source("app","ministries","[slug]","page.tsx");assert.match(hub,/The Hearth/);assert.match(hub,/The Foundry/);assert.match(hub,/Men's Study/);assert.match(page,/ministry_memberships/);assert.match(page,/ministry_content/);assert.match(page,/joinMinistry/);assert.match(page,/leaveMinistry/);assert.match(page,/Choose a meaningful action/)});

test("each current ministry has a distinct formation rhythm",async()=>{const page=await source("app","ministries","[slug]","page.tsx");assert.match(page,/Around the Hearth/);assert.match(page,/Formation in motion/);assert.match(page,/The study table/);assert.match(page,/Belonging is practiced/);assert.match(page,/Growth should become faithful action/);assert.match(page,/Read carefully\. Speak honestly\. Walk it out/)});

test("ministry spaces stay connected to the wider L&F ecosystem",async()=>{const page=await source("app","ministries","[slug]","page.tsx");const hub=await source("lib","ministry-hub.ts");assert.match(page,/One L&F family/);assert.match(page,/Prayer, praise, testimony, gatherings, and discovery/);assert.match(hub,/\/auth\/emmaus\?next=\/study/);assert.doesNotMatch(page,/Rare Network|Rare of Breed/);assert.doesNotMatch(hub,/Rare Network|Rare of Breed/)});
