import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("My Path dashboard is the signed-in ministry and learning home", async () => {
  const dashboard = await readFile(path.join(root, "app", "dashboard", "page.tsx"), "utf8");

  assert.match(dashboard, /My Path/);
  assert.match(dashboard, /Continue Emmaus/);
  assert.match(dashboard, /Review verses/);
  assert.match(dashboard, /Daily challenge/);
  assert.match(dashboard, /Fresh from L&F/);
  assert.match(dashboard, /My spaces/);
  assert.match(dashboard, /Community rhythm/);
  assert.match(dashboard, /content_progress/);
  assert.match(dashboard, /memory_verse_progress/);
  assert.match(dashboard, /quiz_attempts/);
  assert.match(dashboard, /content_catalog/);
});

test("public landing page remains distinct from signed-in My Path", async () => {
  const landing = await readFile(path.join(root, "app", "page.tsx"), "utf8");

  for (const ticker of ["PrayerWallTicker", "PraiseTicker", "TestimonyTicker"]) {
    assert.doesNotMatch(landing, new RegExp(ticker));
  }
  assert.match(landing, /About the Project/);
  assert.match(landing, /Funding the mission/);
});

test("member navigation matches the Platform 2.0 five-destination shell", async () => {
  const source = await readFile(path.join(root, "components", "BottomNav.tsx"), "utf8");

  for (const destination of ["/dashboard", "/ministries", "/prayer", "/community", "/more"]) {
    assert.match(source, new RegExp(`href: "${destination}"`));
  }
  for (const label of ["Home", "Discover", "Prayer", "Community", "Me"]) {
    assert.match(source, new RegExp(`label: "${label}"`));
  }
  assert.match(source, /grid-cols-5/);
});
