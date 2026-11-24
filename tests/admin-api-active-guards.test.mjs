import assert from "node:assert/strict";
import fs from "node:fs";

const routes = [
  "app/api/admin/community-content/moderate/route.ts",
  "app/api/admin/users/delete/route.ts",
  "app/api/admin/testimonies/delete/route.ts",
  "app/api/admin/users/set-supervision/route.ts",
  "app/api/admin/prayer-requests/update/route.ts",
  "app/api/admin/praise-reports/delete/route.ts",
];

for (const path of routes) {
  const source = fs.readFileSync(path, "utf8");
  assert.match(source, /select\("role,preview_role,is_active"\)/, path);
  assert.match(source, /callerProfile\?\.is_active !== true \|\| getEffectiveRole\(callerProfile\?\.role, callerProfile\?\.preview_role\) !== "admin"/, path);
}
console.log("privileged admin API active guards: ok");
