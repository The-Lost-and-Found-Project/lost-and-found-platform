import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("Ministry Compass is a transparent three-step deterministic pathway", async () => {
  const [page, client] = await Promise.all([
    source("app", "compass", "page.tsx"),
    source("components", "MinistryCompassClient.tsx"),
  ]);

  assert.match(page, /Ministry Compass/);
  assert.match(page, /does not diagnose your spiritual life/);
  assert.match(client, /What do you need most right now/);
  assert.match(client, /How would you prefer to engage/);
  assert.match(client, /What kind of next step feels realistic/);
  assert.match(client, /chooseRecommendation/);
  assert.match(client, /deterministic guidance, not AI discernment/);
  assert.match(client, /not a judgment about your faith or spiritual maturity/);
});

test("Ministry Compass connects into the existing L&F ecosystem instead of creating a new backend", async () => {
  const [client, ministries] = await Promise.all([
    source("components", "MinistryCompassClient.tsx"),
    source("app", "ministries", "page.tsx"),
  ]);

  for (const route of ["/dashboard", "/discover", "/prayer", "/community", "/ministries", "/learn", "/auth/emmaus?next=/study"]) {
    assert.match(client, new RegExp(route.replace(/[?]/g, "\\?")));
  }
  assert.match(ministries, /href="\/compass"/);
  assert.doesNotMatch(client, /fetch\(|supabase|openai|anthropic/i);
});
