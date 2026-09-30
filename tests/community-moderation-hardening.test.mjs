import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("member Community writes cannot self-approve moderation state",()=>{
 const migration=read("supabase/migrations/20260930000500_harden_community_member_updates.sql");
 assert.match(migration,/drop policy if exists testimonies_insert_own/);
 assert.match(migration,/drop policy if exists testimonies_update_own/);
 assert.match(migration,/drop policy if exists praise_insert_own/);
 assert.match(migration,/drop policy if exists praise_update_own/);
 assert.match(migration,/submit_own_testimony/);
 assert.match(migration,/moderation_status = 'pending'|,'pending'\)/);
 assert.match(migration,/update_own_testimony/);
});

test("testimony create and edit use narrow RPCs",()=>{
 const client=read("components/TestimonySubmitClient.tsx");
 assert.match(client,/rpc\("submit_own_testimony"/);
 assert.match(client,/rpc\("update_own_testimony"/);
 assert.doesNotMatch(client,/from\("testimonies"\)\.insert/);
 assert.doesNotMatch(client,/from\("testimonies"\)\.update/);
});

test("admin can approve or deny praise and testimony with member notification",()=>{
 const route=read("app/api/admin/community-content/moderate/route.ts");
 const client=read("components/AdminContentClient.tsx");
 const page=read("app/admin/content/page.tsx");
 assert.match(route,/STATUSES=new Set\(\["approved","denied"\]\)/);
 assert.match(route,/callerProfile\?\.role\s*!==\s*"admin"/);
 assert.match(route,/content_approved/);
 assert.match(route,/content_denied/);
 assert.match(client,/Approve/);
 assert.match(client,/Deny/);
 assert.match(client,/community-content\/moderate/);
 assert.match(page,/moderation_status/);
});

test("praise linked to a prayer closes public prayer visibility",()=>{
 const route=read("app/api/praise-reports/submit/route.ts");
 assert.match(route,/answered: true, status: "Resolved", is_public: false/);
});
