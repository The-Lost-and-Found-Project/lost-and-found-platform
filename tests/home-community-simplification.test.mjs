import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(path)=>fs.readFileSync(path,"utf8");

test("Home focuses on what matters now instead of duplicating every learning surface",()=>{
 const home=read("app/dashboard/page.tsx");
 assert.match(home,/For you now/);
 assert.match(home,/Upcoming Live Studies/);
 assert.match(home,/Daily Path/);
 assert.match(home,/Home shows what needs your attention now/);
 assert.match(home,/Open Scripture in Emmaus/);
 assert.match(home,/Open Learning Lab/);
 assert.doesNotMatch(home,/Your rhythm/);
 assert.doesNotMatch(home,/Pick up where you left off/);
 assert.doesNotMatch(home,/Fresh from L&F/);
 assert.doesNotMatch(home,/Community rhythm/);
});

test("Home quick actions route to primary member destinations",()=>{
 const home=read("app/dashboard/page.tsx");
 for(const destination of ["/discover","/prayer","/events","/community"])assert.match(home,new RegExp(`href:"${destination}"`));
});

test("Community has one participation pulse instead of repeated Prayer Praise Testimony menus",()=>{
 const community=read("app/community/page.tsx");
 assert.match(community,/Prayer Pulse/);
 assert.match(community,/Find a Gathering/);
 assert.match(community,/Ministry Spaces/);
 assert.match(community,/Presence over performance/);
 assert.doesNotMatch(community,/Act now/);
 assert.doesNotMatch(community,/const spaces=/);
 assert.doesNotMatch(community,/const communityActions=/);
});
