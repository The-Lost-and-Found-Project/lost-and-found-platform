import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("community preserves destination and exposes a consistent participation layer",()=>{
 const community=read("app/community/page.tsx");
 assert.match(community,/login\?next=%2Fcommunity/);
 assert.match(community,/Act now/);
 assert.match(community,/Prayer/);
 assert.match(community,/Praise/);
 assert.match(community,/Testimony/);
 assert.match(community,/Gatherings/);
});

test("community operating layer keeps discipleship and privacy guardrails explicit",()=>{
 const spec=read("docs/community-operating-layer.md");
 assert.match(spec,/participation over scrolling/i);
 assert.match(spec,/No generic infinite social feed/);
 assert.match(spec,/No duplicate auth/);
 assert.match(spec,/private prayers/);
 assert.match(spec,/Rare Network remains completely separate/);
 assert.match(spec,/Video transport is a separate implementation decision/);
});
