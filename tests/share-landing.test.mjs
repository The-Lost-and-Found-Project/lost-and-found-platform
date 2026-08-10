import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const shareButton = await readFile(new URL("../components/ShareButton.tsx", import.meta.url), "utf8");
const landing = await readFile(new URL("../app/share/page.tsx", import.meta.url), "utf8");
const middleware = await readFile(new URL("../lib/supabase/middleware.ts", import.meta.url), "utf8");

test("Share With a Friend sends the dedicated public invitation URL", () => {
  assert.match(shareButton, /\/share/);
  assert.match(shareButton, /Share With a Friend/);
  assert.match(shareButton, /Invitation link copied!/);
  assert.match(shareButton, /min-h-11/);
  assert.doesNotMatch(middleware, /PROTECTED_PREFIXES[\s\S]*"\/share"/);
});

test("the invitation page clearly distinguishes membership from Prayer Care Team service", () => {
  assert.match(landing, /You don’t have to walk alone/);
  assert.match(landing, /For every member/);
  assert.match(landing, /Optional service role/);
  assert.match(landing, /application and human review/);
  assert.match(landing, /without taking away the regular member experience/);
  assert.match(landing, /href="\/signup"/);
  assert.match(landing, /href="\/login"/);
  assert.match(landing, /public Prayer Wall/);
  assert.doesNotMatch(landing, /Emmaus/);
});
