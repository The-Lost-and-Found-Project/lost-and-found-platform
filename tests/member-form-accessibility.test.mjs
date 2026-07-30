import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("member forms and settings expose names and mobile touch targets", async () => {
  const [settings, push, praise, testimony] = await Promise.all([
    readFile(path.join(root, "components", "SettingsClient.tsx"), "utf8"),
    readFile(path.join(root, "components", "PushNotificationToggle.tsx"), "utf8"),
    readFile(path.join(root, "components", "PraiseSubmitClient.tsx"), "utf8"),
    readFile(path.join(root, "components", "TestimonySubmitClient.tsx"), "utf8"),
  ]);

  assert.match(settings, /role="switch"\s+aria-label=\{title\}/);
  assert.match(push, /role="switch"\s+aria-label="Push notifications"/);
  assert.match(settings, /h-11 w-11/);
  assert.match(push, /h-11 w-11/);

  assert.match(praise, /htmlFor="praise-report"/);
  assert.match(praise, /id="praise-report"/);
  assert.match(testimony, /htmlFor="testimony"/);
  assert.match(testimony, /id="testimony"/);

  for (const source of [push, praise, testimony]) {
    assert.match(source, /role="alert" aria-live="polite"/);
  }
  for (const source of [praise, testimony]) {
    assert.match(source, /min-h-11/);
  }
});
