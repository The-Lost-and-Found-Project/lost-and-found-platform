import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("Verse Insights behaves like a real modal for keyboard users",()=>{
 const source=read("components/emmaus/VerseInsightPanel.tsx");
 assert.match(source,/aria-modal="true"/);
 assert.match(source,/closeButtonRef\.current\?\.focus\(\)/);
 assert.match(source,/event\.key==="Escape"/);
 assert.match(source,/event\.key!=="Tab"/);
 assert.match(source,/previouslyFocused\?\.focus\(\)/);
 assert.match(source,/document\.body\.style\.overflow="hidden"/);
 assert.match(source,/ref=\{panelRef\}/);
 assert.match(source,/ref=\{closeButtonRef\}/);
});

test("Verse Insights close control meets touch target minimum",()=>{
 const source=read("components/emmaus/VerseInsightPanel.tsx");
 assert.match(source,/ref=\{closeButtonRef\}[\s\S]*min-h-11/);
});
