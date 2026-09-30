import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("Settings does not masquerade database failures as default preferences",()=>{
 const source=read("app/settings/page.tsx");
 assert.match(source,/existingError/);
 assert.match(source,/throw existingError/);
 assert.match(source,/createError/);
 assert.match(source,/throw createError/);
});

test("Profile does not render blank personal data when its read fails",()=>{
 const source=read("app/profile/page.tsx");
 assert.match(source,/profileError/);
 assert.match(source,/throw profileError/);
});

test("Notifications does not treat a failed read as an empty inbox",()=>{
 const source=read("app/notifications/page.tsx");
 assert.match(source,/profileError/);
 assert.match(source,/notificationsError/);
 assert.match(source,/throw notificationsError/);
});
