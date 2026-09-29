import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("My Path dashboard is the signed-in ministry and learning home", async () => {
  const dashboard = await readFile(path.join(root, "app", "dashboard", "page.tsx"), "utf8");
  assert.match(dashboard, /My Path/);
  assert.match(dashboard, /Open Scripture in Emmaus/);
  assert.match(dashboard, /Open Learning Lab/);
  assert.match(dashboard, /Daily Path/);
  assert.match(dashboard, /Your ministry spaces|Find your ministry space/);
  assert.match(dashboard, /content_progress/);
  assert.match(dashboard, /memory_verse_progress/);
  assert.match(dashboard, /quiz_attempts/);
  assert.match(dashboard, /content_catalog/);
});
