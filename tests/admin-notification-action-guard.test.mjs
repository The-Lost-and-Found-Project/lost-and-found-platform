import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("notification sending requires an active effective admin", async () => {
  const source = await readFile("app/admin/notifications/actions.ts", "utf8");
  assert.match(source, /select\("role,preview_role,is_active"\)/);
  assert.match(source, /p\?\.is_active!==true\|\|getEffectiveRole/);
  assert.match(source, /safeInternalLink/);
  assert.match(source, /SEND TO ALL/);
});
