import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(path)=>fs.readFileSync(path,"utf8");

test("Discover is the next-step finder rather than a duplicate Home or ministry feed",()=>{
 const page=read("app/discover/page.tsx");
 assert.match(page,/login\?next=%2Fdiscover/);
 assert.match(page,/What would help you take your/);
 assert.match(page,/Start with one honest need/);
 assert.match(page,/Choose a lane/);
 assert.match(page,/Library/);
 assert.match(page,/Learning Lab/);
 assert.match(page,/Emmaus/);
 assert.doesNotMatch(page,/Fresh around L&F/);
 assert.doesNotMatch(page,/Ministry updates and gatherings/);
 assert.doesNotMatch(page,/My Path is becoming/);
 assert.doesNotMatch(page,/ministryPortals/);
});

test("Discover explains the difference between Library Learning Lab and Emmaus",()=>{
 const page=read("app/discover/page.tsx");
 assert.match(page,/Use the Library when you already know/);
 assert.match(page,/Use Learning Lab for Bible Trivia/);
 assert.match(page,/Use Emmaus when a passage deserves slower, deeper study/);
});

test("Me is personal and account-focused instead of duplicating primary navigation",()=>{
 const page=read("app/more/page.tsx");
 assert.match(page,/login\?next=%2Fmore/);
 assert.match(page,/My Prayer Journey/);
 assert.match(page,/Notifications/);
 assert.match(page,/Preferences/);
 assert.match(page,/Account & Security/);
 assert.match(page,/Feedback/);
 assert.doesNotMatch(page,/Explore & participate/);
 assert.doesNotMatch(page,/label:"Discover"/);
 assert.doesNotMatch(page,/label:"Community"/);
 assert.doesNotMatch(page,/label:"Gatherings"/);
});
