import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("profile editing controls expose accessible names and feedback", async () => {
  const profile = await readFile(
    path.join(root, "components", "ProfileClient.tsx"),
    "utf8"
  );

  for (const id of [
    "profile-full-name",
    "profile-picture",
    "favorite-scripture",
    "date-of-salvation",
    "date-of-baptism",
  ]) {
    assert.match(profile, new RegExp(`htmlFor="${id}"`));
    assert.match(profile, new RegExp(`id="${id}"`));
  }

  assert.match(profile, /aria-label="Preview the app as"/);
  assert.match(profile, /aria-pressed=\{isSelected\}/);
  assert.match(profile, /role="status"\s+aria-live="polite"/);
  assert.match(profile, /role="alert"\s+aria-live="assertive"/);
  assert.match(profile, /min-h-11/);
});
