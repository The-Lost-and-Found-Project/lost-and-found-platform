import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("prayer form fields have VoiceOver labels and touch-sized controls", async () => {
  const source = await readFile(
    path.join(root, "app", "prayer", "submit", "page.tsx"),
    "utf8"
  );
  const fieldIds = [
    "prayer-name",
    "prayer-email",
    "prayer-phone",
    "prayer-category",
    "prayer-request",
  ];

  for (const id of fieldIds) {
    assert.match(source, new RegExp(`htmlFor="${id}"`), `${id} needs a label`);
    assert.match(source, new RegExp(`id="${id}"`), `${id} needs a field id`);
  }

  assert.match(source, /role="alert" aria-live="polite"/);
  assert.ok(
    (source.match(/min-h-11/g) ?? []).length >= 5,
    "primary controls need a 44px minimum touch target"
  );
});
