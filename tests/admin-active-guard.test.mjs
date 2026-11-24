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
  assert.match(ministriesActions, /profile\?\.is_active!==true\) redirect\("\/dashboard"\)/);
  assert.match(ministriesActions, /getEffectiveRole/);
  assert.match(marriagePage, /select\("role,preview_role,is_active"\)/);
  assert.match(marriagePage, /profile\?\.is_active!==true\|\|getEffectiveRole/);
  assert.match(marriageActions, /select\("role,preview_role,is_active"\)/);
  assert.match(marriageActions, /profile\?\.is_active!==true\|\|getEffectiveRole/);
});

test("administrator escalation is restricted to configured server-side Owners", async () => {
  const [route, ownerAccess] = await Promise.all([
    readFile("app/api/admin/users/set-role/route.ts", "utf8"),
    readFile("lib/owner-access.ts", "utf8"),
  ]);
  assert.match(route, /import \{ isConfiguredOwner \} from "@\/lib\/owner-access"/);
  assert.match(route, /const changesAdminAccess = role === "admin" \|\| target\?\.role === "admin"/);
  assert.match(route, /if \(changesAdminAccess && !isConfiguredOwner\(user\)\)/);
  assert.match(ownerAccess, /process\.env\.LFP_OWNER_USER_IDS/);
  assert.doesNotMatch(ownerAccess, /NEXT_PUBLIC_/);
});
