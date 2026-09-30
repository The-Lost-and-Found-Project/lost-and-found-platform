import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("account and public mobile menus stay inside the viewport",()=>{
 const account=read("components/AuthControls.tsx");
 const header=read("components/Header.tsx");
 assert.match(account,/max-h-\[calc\(100dvh-5rem\)\]/);
 assert.match(account,/overflow-y-auto/);
 assert.match(account,/overscroll-contain/);
 assert.match(header,/max-h-\[calc\(100dvh-5rem\)\]/);
 assert.match(header,/overflow-y-auto/);
 assert.match(header,/overscroll-contain/);
});

test("header interactive controls meet the 44px touch target standard",()=>{
 const header=read("components/Header.tsx");
 assert.match(header,/aria-label="Send feedback"[\s\S]*h-11 w-11/);
 assert.match(header,/summary className="flex min-h-11/);
});
