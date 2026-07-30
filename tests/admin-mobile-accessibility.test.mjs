import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("user administration controls have contextual names and touch targets", async () => {
  const users = await readFile(
    path.join(root, "components", "AdminUsersClient.tsx"),
    "utf8"
  );

  assert.match(users, /aria-label=\{`Role for \$\{accessibleName\}`\}/);
  assert.match(users, /aria-label=\{`Account status for \$\{accessibleName\}`\}/);
  assert.match(users, /aria-label=\{`Delete account for \$\{accessibleName\}`\}/);
  assert.match(users, /role="alert"\s+aria-live="assertive"/);
  assert.match(users, /min-h-11/);
});

test("application decisions expose labels, state, and touch targets", async () => {
  const applications = await readFile(
    path.join(root, "components", "AdminApplicationsClient.tsx"),
    "utf8"
  );

  assert.match(applications, /htmlFor=\{`deny-note-\$\{app\.id\}`\}/);
  assert.match(applications, /id=\{`deny-note-\$\{app\.id\}`\}/);
  assert.match(applications, /aria-expanded=\{showReviewed\}/);
  assert.match(applications, /aria-controls="reviewed-applications"/);
  assert.match(applications, /role="alert"\s+aria-live="assertive"/);
  assert.match(applications, /min-h-11/);
});
