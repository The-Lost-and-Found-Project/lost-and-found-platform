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
  assert.match(users, /aria-label=\{`\$\{member\.is_active \? "Deactivate" : "Reactivate"\} account for \$\{accessibleName\}`\}/);
  assert.match(users, /aria-label=\{`Delete account for \$\{accessibleName\}`\}/);
  assert.match(users, /role="alert"\s+aria-live="assertive"/);
  assert.match(users, /min-h-11/);
  assert.match(users, /id="user-directory-search"/);
  assert.match(users, /role="status" aria-live="polite"/);
  assert.match(users, /Everyone uses one Community Member identity/);
  assert.doesNotMatch(users, /assignment|rotation|reassign/i);
});

test("legacy Prayer Care applications are no longer actionable", async () => {
  const [page, route] = await Promise.all([
    readFile(path.join(root, "app", "admin", "applications", "page.tsx"), "utf8"),
    readFile(path.join(root, "app", "api", "admin", "applications", "decide", "route.ts"), "utf8"),
  ]);
  assert.match(page, /redirect\("\/admin"\)/);
  assert.match(route, /retiredPrayerCareResponse/);
});
