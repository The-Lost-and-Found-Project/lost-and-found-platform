import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("community Home keeps the three core actions and voluntary giving", async () => {
  const dashboard = await readFile(
    path.join(root, "app", "dashboard", "page.tsx"),
    "utf8"
  );

  for (const destination of ["/prayer", "/praise", "/testimonies"]) {
    assert.match(dashboard, new RegExp(`href="${destination}"`));
  }
  assert.match(dashboard, /Giving is always optional/);
  assert.doesNotMatch(dashboard, /href="\/(emmaus|trivia|devotions|grow|prayer-assignments|prayer-care-application)/);
});

test("member navigation contains only the approved five primary destinations", async () => {
  const source = await readFile(path.join(root, "components", "BottomNav.tsx"), "utf8");

  for (const destination of ["/dashboard", "/prayer", "/praise", "/testimonies", "/notifications"]) {
    assert.match(source, new RegExp(`href: "${destination}"`));
  }
  assert.doesNotMatch(source, /href: "\/(grow|community|more)"/);
});
