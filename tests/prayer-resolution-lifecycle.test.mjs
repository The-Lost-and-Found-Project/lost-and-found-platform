import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("member resolution preserves history but removes the prayer from the active wall",()=>{
 const route=read("app/api/prayer-requests/mine/update/route.ts");
 const resolveStart=route.indexOf('action === "resolve"');
 assert.ok(resolveStart>=0);
 const resolveBlock=route.slice(resolveStart,route.indexOf("} else {",resolveStart));
 assert.match(resolveBlock,/answered: true/);
 assert.match(resolveBlock,/status: "Resolved"/);
 assert.match(resolveBlock,/answered_update/);
 assert.match(resolveBlock,/is_public: false/);
});

test("public Prayer Wall projection excludes terminal prayer states",()=>{
 const migration=read("supabase/migrations/20260929235500_harden_prayer_resolution_lifecycle.sql");
 assert.match(migration,/update public\.prayer_requests[\s\S]*answered is true[\s\S]*is_public is true/);
 assert.match(migration,/coalesce\(answered, false\) is false/);
 assert.match(migration,/status not in \('Resolved','Closed','Withdrawn'\)/);
});
