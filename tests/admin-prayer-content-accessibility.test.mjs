import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("prayer administration exposes control names, state, and touch targets", async () => {
  const prayer = await readFile(
    path.join(root, "components", "AdminPrayerDashboardClient.tsx"),
    "utf8"
  );

  assert.match(prayer, /htmlFor="admin-status-filter"/);
  assert.match(prayer, /id="admin-status-filter"/);
  assert.match(prayer, /aria-pressed=\{attentionOnly\}/);
  assert.match(prayer, /aria-pressed=\{flaggedOnly\}/);
  assert.match(prayer, /aria-expanded=\{expanded\}/);
  assert.match(prayer, /aria-controls=\{`prayer-request-\$\{r\.id\}`\}/);
  assert.match(prayer, /aria-label=\{`Status for \$\{r\.name\}'s prayer request`\}/);
  assert.match(prayer, /aria-label=\{`Assignee for \$\{r\.name\}'s prayer request`\}/);
  assert.match(prayer, /htmlFor=\{`praise-report-\$\{r\.id\}`\}/);
  assert.match(prayer, /min-h-11/);
});

test("content moderation actions are contextual and touch sized", async () => {
  const content = await readFile(
    path.join(root, "components", "AdminContentClient.tsx"),
    "utf8"
  );

  assert.match(content, /aria-label=\{`Delete \$\{author\}'s testimony`\}/);
  assert.match(content, /aria-label=\{`Delete \$\{author\}'s praise report`\}/);
  assert.match(content, /role="alert"\s+aria-live="assertive"/);
  assert.match(content, /min-h-11/);
});
