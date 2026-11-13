import assert from "node:assert/strict";
import fs from "node:fs";

const routes = [
  "app/api/admin/giving/zeffy-sync/route.ts",
  "app/api/admin/prayer-requests/delete/route.ts",
  "app/api/admin/send-test-push/route.ts",
  "app/api/admin/users/set-active/route.ts",
  "app/api/admin/users/set-role/route.ts",
];

for (const path of routes) {
  const source = fs.readFileSync(path, "utf8");
  assert.match(source, /select\("role,preview_role,is_active"\)/, path);
  assert.match(source, /callerProfile\?\.is_active !== true \|\| getEffectiveRole\(callerProfile\?\.role, callerProfile\?\.preview_role\) !== "admin"/, path);
}
console.log("remaining privileged admin API active guards: ok");
