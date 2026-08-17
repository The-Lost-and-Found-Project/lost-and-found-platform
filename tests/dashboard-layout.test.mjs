import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("community Home is dedicated to Project, app, and funding information", async () => {
  const dashboard = await readFile(
    path.join(root, "app", "dashboard", "page.tsx"),
    "utf8"
  );

  for (const ticker of ["PrayerWallTicker", "PraiseTicker", "TestimonyTicker"]) {
    assert.doesNotMatch(dashboard, new RegExp(ticker));
  }
  assert.match(dashboard, /About the Project/);
  assert.match(dashboard, /About the App/);
  assert.match(dashboard, /Funding the mission/);
  assert.match(dashboard, /Community participation remains free/);
  assert.doesNotMatch(dashboard, /href="\/(prayer|praise|testimonies)/);
  assert.doesNotMatch(dashboard, /href="\/(emmaus|trivia|devotions|grow|prayer-assignments|prayer-care-application)/);
});

test("public landing page explains the Project, app, and funding without community navigation", async () => {
  const landing = await readFile(path.join(root, "app", "page.tsx"), "utf8");

  for (const ticker of ["PrayerWallTicker", "PraiseTicker", "TestimonyTicker"]) {
    assert.doesNotMatch(landing, new RegExp(ticker));
  }
  assert.match(landing, /About the Project/);
  assert.match(landing, /About the Community App/);
  assert.match(landing, /Funding the mission/);
  assert.doesNotMatch(landing, /href: "\/(prayer|praise|testimonies)"/);
  assert.doesNotMatch(landing, /care team|Prayer Care|journey/i);
});

test("Future Apps page offers preserved products without dead in-app links", async () => {
  const [apps, more] = await Promise.all([
    readFile(path.join(root, "app", "apps", "page.tsx"), "utf8"),
    readFile(path.join(root, "app", "more", "page.tsx"), "utf8"),
  ]);

  for (const product of ["Emmaus", "Bible Trivia", "Devotions"]) {
    assert.match(apps, new RegExp(`name: "${product}"`));
  }
  assert.match(apps, /moving, not being discontinued/i);
  assert.match(apps, /Separate app · Coming later/);
  assert.doesNotMatch(apps, /href="\/(emmaus|trivia|devotions)/);
  assert.match(more, /href: "\/apps"/);
});

test("member navigation contains only the approved five primary destinations", async () => {
  const source = await readFile(path.join(root, "components", "BottomNav.tsx"), "utf8");

  for (const destination of ["/dashboard", "/prayer", "/praise", "/testimonies", "/notifications"]) {
    assert.match(source, new RegExp(`href: "${destination}"`));
  }
  assert.doesNotMatch(source, /href: "\/(grow|community|more)"/);
});
