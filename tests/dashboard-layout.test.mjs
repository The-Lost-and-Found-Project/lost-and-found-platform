import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("dashboard feature cards keep tablet buttons in one aligned column", async () => {
  const source = await readFile(
    path.join(root, "app", "dashboard", "page.tsx"),
    "utf8"
  );

  const tabletCardLayouts =
    source.match(/sm:grid-cols-\[minmax\(0,1fr\)_auto\]/g) ?? [];
  const tabletButtonAlignment =
    source.match(/sm:justify-self-end/g) ?? [];

  assert.ok(
    tabletCardLayouts.length >= 2,
    "dashboard feature cards must use a stable tablet grid"
  );
  assert.ok(
    tabletButtonAlignment.length >= 2,
    "dashboard feature buttons must share the right-side tablet column"
  );
});

test("care-team members can open assignments directly from the dashboard", async () => {
  const source = await readFile(
    path.join(root, "app", "dashboard", "page.tsx"),
    "utf8"
  );

  assert.match(
    source,
    /\{isCareTeam && \([\s\S]*My Prayer Assignments[\s\S]*href="\/prayer-assignments"[\s\S]*View Assignments/
  );
});
