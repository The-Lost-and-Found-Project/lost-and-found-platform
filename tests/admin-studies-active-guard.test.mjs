import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/admin/studies/page.tsx", "utf8");
const actions = fs.readFileSync("app/admin/studies/actions.ts", "utf8");
assert.match(page, /select\("role,preview_role,is_active"\)/);
assert.match(page, /p\?\.is_active!==true\|\|!canManageStudies\(role\)/);
assert.match(actions, /select\("role,preview_role,is_active"\)/);
assert.match(actions, /if\(p\?\.is_active!==true\)redirect\("\/dashboard"\)/);
console.log("Bible Studies active guards: ok");
