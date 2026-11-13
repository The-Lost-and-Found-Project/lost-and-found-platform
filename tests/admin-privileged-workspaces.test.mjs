import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Creator Studio and L&F Live require active effective roles", async () => {
  const [libraryPage, libraryActions, livePage] = await Promise.all([
    readFile("app/admin/library/page.tsx", "utf8"),
    readFile("app/admin/library/actions.ts", "utf8"),
    readFile("app/admin/live/page.tsx", "utf8"),
  ]);
  for (const source of [libraryPage, libraryActions]) {
    assert.match(source, /role,preview_role,is_active/);
    assert.match(source, /is_active!==true\|\|getEffectiveRole/);
  }
  assert.match(livePage, /role,preview_role,is_active/);
  assert.match(livePage, /p\?\.is_active!==true/);
  assert.match(livePage, /role!==\"admin\"&&role!==\"supervisor\"/);
});
