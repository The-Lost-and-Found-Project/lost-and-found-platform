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

  for (const ticker of ["PrayerWallTicker", "PraiseTicker", "TestimonyTicker"]) {
    assert.match(dashboard, new RegExp(`<${ticker} \/>`));
  }
  assert.match(dashboard, /Giving is always optional/);
  assert.doesNotMatch(dashboard, /href="\/(emmaus|trivia|devotions|grow|prayer-assignments|prayer-care-application)/);
});

test("public landing page centers the same three tickers without legacy care-team language", async () => {
  const landing = await readFile(path.join(root, "app", "page.tsx"), "utf8");

  for (const ticker of ["PrayerWallTicker", "PraiseTicker", "TestimonyTicker"]) {
    assert.match(landing, new RegExp(`<${ticker} \/>`));
  }
  assert.match(landing, /Pray\. Praise\. Testify\./);
  assert.doesNotMatch(landing, /care team|Prayer Care|journey/i);
  assert.match(landing, /href="\/apps"/);
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
