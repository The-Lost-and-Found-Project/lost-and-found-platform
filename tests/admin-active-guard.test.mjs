import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("admin ministry and marriage pages require an active effective administrator", async () => {
  const [ministriesPage, ministriesActions, marriagePage, marriageActions] = await Promise.all([
    readFile("app/admin/ministries/page.tsx", "utf8"),
    readFile("app/admin/ministries/actions.ts", "utf8"),
    readFile("app/admin/marriage-journey/page.tsx", "utf8"),
    readFile("app/admin/marriage-journey/actions.ts", "utf8"),
  ]);
  assert.match(ministriesPage, /select\("role,preview_role,is_active"\)/);
  assert.match(ministriesPage, /const isActive=p\?\.is_active===true/);
  assert.match(ministriesPage, /getEffectiveRole\(p\?\.role,p\?\.preview_role\)==="admin"/);
  assert.match(ministriesActions, /select\("role,preview_role,is_active"\)/);
  assert.match(ministriesActions, /profile\?\.is_active===true&&getEffectiveRole/);
  assert.match(marriagePage, /select\("role,preview_role,is_active"\)/);
  assert.match(marriagePage, /profile\?\.is_active!==true\|\|getEffectiveRole/);
  assert.match(marriageActions, /select\("role,preview_role,is_active"\)/);
  assert.match(marriageActions, /profile\?\.is_active!==true\|\|getEffectiveRole/);
});
