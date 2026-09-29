import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("high-value protected member routes preserve their destination through login",()=>{
 const expectations={
  "app/feedback/page.tsx":"/login?next=%2Ffeedback",
  "app/memory/page.tsx":"/login?next=%2Fmemory",
  "app/testimonies/submit/page.tsx":"/login?next=%2Ftestimonies%2Fsubmit",
  "app/compass/page.tsx":"/login?next=%2Fcompass",
  "app/notifications/page.tsx":"/login?next=%2Fnotifications",
 };
 for(const [path,destination] of Object.entries(expectations))assert.match(read(path),new RegExp(destination.replace(/[?]/g,"\\?")));
});

test("linked praise submission preserves both route and prayer request id",()=>{
 const page=read("app/praise/submit/page.tsx");
 assert.match(page,/encodeURIComponent\(prayer_request_id\)/);
 assert.match(page,/encodeURIComponent\(destination\)/);
 assert.match(page,/\/praise\/submit\?prayer_request_id=/);
});

test("mobile quick action clears the bottom navigation and respects safe area",()=>{
 const action=read("components/UniversalAction.tsx");
 const navigation=read("components/BottomNav.tsx");
 assert.match(action,/env\(safe-area-inset-bottom\)/);
 assert.match(action,/calc\(5\.75rem \+ env\(safe-area-inset-bottom\)\)/);
 assert.match(action,/max-h-\[min\(70vh,34rem\)\]/);
 assert.match(action,/focus-visible:ring-2/);
 assert.match(navigation,/env\(safe-area-inset-bottom\)/);
 assert.match(navigation,/grid-cols-5/);
});

test("retired Prayer Care applications are not a primary admin tab",()=>{
 const navigation=read("components/BottomNav.tsx");
 assert.doesNotMatch(navigation,/href:"\/admin\/applications"/);
});
