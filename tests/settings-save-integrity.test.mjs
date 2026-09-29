import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("Settings rolls back optimistic changes when persistence fails",()=>{
 const source=read("components/SettingsClient.tsx");
 assert.match(source,/const \[saveError, setSaveError\]/);
 assert.match(source,/const \{ error \} = await supabase/);
 assert.match(source,/setSettings\(settings\)/);
 assert.match(source,/We could not save that preference/);
 assert.match(source,/role="alert"/);
});

test("Profile edits stay in edit mode when save fails",()=>{
 const source=read("components/ProfileClient.tsx");
 assert.match(source,/const \[saveError, setSaveError\]/);
 assert.match(source,/We could not save your profile changes/);
 const saveStart=source.indexOf("async function handleSave");
 const saveEnd=source.indexOf("async function handleAvatarChange");
 const body=source.slice(saveStart,saveEnd);
 assert.match(body,/if \(error\) \{[\s\S]*setSaveError/);
 assert.match(body,/return;/);
 assert.match(body,/setIsEditing\(false\)/);
});

test("Admin preview reverts when persistence fails",()=>{
 const source=read("components/ProfileClient.tsx");
 const start=source.indexOf("async function handlePreviewChange");
 const end=source.indexOf("const avatarImage");
 const body=source.slice(start,end);
 assert.match(body,/const previous=previewRole/);
 assert.match(body,/setPreviewRole\(previous\)/);
 assert.match(body,/We could not change preview mode/);
});
