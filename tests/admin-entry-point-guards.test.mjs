import assert from "node:assert/strict";
import fs from "node:fs";

const admin = fs.readFileSync("app/admin/page.tsx", "utf8");
const creator = fs.readFileSync("app/admin/creator/page.tsx", "utf8");

assert.match(admin, /select\("full_name, role, preview_role, is_active"\)/);
assert.match(admin, /profile\?\.is_active !== true \|\| effectiveRole !== "admin"/);
assert.match(creator, /select\("role,preview_role,is_active"\)/);
assert.match(creator, /profile\?\.is_active!==true\|\|getEffectiveRole/);

console.log("admin entry-point active guards: ok");
