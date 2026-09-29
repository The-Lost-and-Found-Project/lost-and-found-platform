import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("admin notification destinations are restricted to safe internal L&F paths",()=>{
 const actions=read("app/admin/notifications/actions.ts");
 const client=read("components/NotificationsClient.tsx");
 assert.match(actions,/function safeInternalLink/);
 assert.match(actions,/value\.startsWith\("\/"\)/);
 assert.match(actions,/!value\.startsWith\("\/\/"\)/);
 assert.match(actions,/rawLink&&!link/);
 assert.match(client,/function safeNotificationDestination/);
 assert.match(client,/router\.push\(safeNotificationDestination\(notification\.link\)\)/);
});

test("retired Prayer Team is not a broadcast audience",()=>{
 const page=read("app/admin/notifications/page.tsx");
 const actions=read("app/admin/notifications/actions.ts");
 assert.doesNotMatch(page,/value="prayer_team"/);
 assert.doesNotMatch(actions,/audience==="prayer_team"/);
});

test("broadcast campaigns only target active accounts",()=>{
 const actions=read("app/admin/notifications/actions.ts");
 assert.match(actions,/\.eq\("is_active",true\)/);
 assert.match(actions,/No active recipients matched this audience/);
});
