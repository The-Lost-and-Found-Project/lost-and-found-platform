import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("My Path dashboard is the signed-in what-matters-now home", async () => {
  const dashboard = await readFile(path.join(root, "app", "dashboard", "page.tsx"), "utf8");
  assert.match(dashboard, /My Path/);
  assert.match(dashboard, /Continue Emmaus/);
  assert.match(dashboard, /Daily Path/);
  assert.match(dashboard, /Upcoming Live Studies/);
  assert.match(dashboard, /Open Learning Lab/);
  assert.match(dashboard, /Your ministry spaces|Find your ministry space/);
  assert.match(dashboard, /content_progress/);
  assert.match(dashboard, /memory_verse_progress/);
  assert.match(dashboard, /quiz_attempts/);
  assert.match(dashboard, /content_catalog/);
  assert.doesNotMatch(dashboard, /Fresh from L&F/);
  assert.doesNotMatch(dashboard, /Community rhythm/);
});

test("public landing page is the Platform 2.0 front door", async () => {
  const landing = await readFile(path.join(root, "app", "page.tsx"), "utf8");
  for (const ticker of ["PrayerWallTicker", "PraiseTicker", "TestimonyTicker"]) assert.doesNotMatch(landing, new RegExp(ticker));
  assert.match(landing, /The Lost &amp; Found Project/);
  assert.match(landing, /Where are you right now/);
  assert.match(landing, /Explore Emmaus/);
  assert.match(landing, /Scripture first\. Salvation first\. People before platforms/);
  assert.match(landing, /Pray\. Serve\. Share\. Give/);
  assert.match(landing, /if\s*\(user\)\s*redirect\("\/dashboard"\)/);
});

test("member navigation matches the Platform 2.0 five-destination shell", async () => {
  const source = await readFile(path.join(root, "components", "BottomNav.tsx"), "utf8");
  for (const destination of ["/dashboard", "/discover", "/prayer", "/community", "/more"]) assert.match(source, new RegExp(`href\\s*:\\s*"${destination}"`));
  for (const label of ["Home", "Discover", "Prayer", "Community", "Me"]) assert.match(source, new RegExp(`label\\s*:\\s*"${label}"`));
  assert.match(source, /grid-cols-5/);
});
