import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("lib/role-access.ts", "utf8");
assert.match(source, /select\("role,preview_role,is_active"\)/);
assert.match(source, /profile\?\.is_active !== true \|\| !hasCapability\(role, capability\)/);
console.log("shared active-profile capability guard: ok");
