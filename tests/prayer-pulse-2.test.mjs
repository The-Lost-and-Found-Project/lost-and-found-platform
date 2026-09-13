import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root=process.cwd();
const source=(...parts)=>readFile(path.join(root,...parts),"utf8");

test("Community Prayer Pulse brings prayer praise and testimony together",async()=>{const community=await source("app","community","page.tsx");assert.match(community,/Prayer Pulse/);assert.match(community,/PrayerWallTicker/);assert.match(community,/PraiseTicker/);assert.match(community,/TestimonyTicker/);assert.match(community,/Prayer can become praise/);assert.match(community,/Presence over performance/)});

test("Prayer Pulse explains interaction rules without vanity metrics",async()=>{const community=await source("app","community","page.tsx");assert.match(community,/Prayer can be marked repeatedly/);assert.match(community,/Praise can be loved once per member/);assert.match(community,/Testimony can be encouraged once per member/);assert.match(community,/You cannot react to your own prayer, praise, or testimony/);assert.match(community,/not popularity metrics/)});

test("dedicated prayer page preserves repeated intentional prayer",async()=>{const prayer=await source("app","prayer","page.tsx");assert.match(prayer,/Prayer is an action, not a reaction/);assert.match(prayer,/You can return and pray again/);assert.match(prayer,/<PrayerWallTicker pageMode/)});
