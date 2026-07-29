import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

async function routeFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return routeFiles(fullPath);
      return entry.name === "route.ts" ? [fullPath] : [];
    })
  );
  return nested.flat();
}

test("all admin routes using the service role verify the caller is an admin", async () => {
  const files = await routeFiles(path.join(root, "app", "api", "admin"));

  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (!source.includes("createAdminClient")) continue;

    assert.match(source, /auth\.getUser\(\)/, `${file} must authenticate`);
    assert.match(
      source,
      /callerProfile\?\.role !== "admin"/,
      `${file} must verify the admin role`
    );
  }
});

test("every cron route verifies the Vercel cron bearer secret", async () => {
  const files = await routeFiles(path.join(root, "app", "api", "cron"));
  assert.ok(files.length > 0, "expected cron routes");

  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.match(source, /authorization/, `${file} must read authorization`);
    assert.match(source, /CRON_SECRET/, `${file} must require CRON_SECRET`);
    assert.match(source, /status:\s*401/, `${file} must reject invalid callers`);
  }
});

test("service-role credentials never appear in public environment variables", async () => {
  const source = await readFile(path.join(root, ".env.example"), "utf8");
  assert.doesNotMatch(source, /NEXT_PUBLIC_[A-Z0-9_]*SERVICE_ROLE/);
  assert.match(source, /^SUPABASE_SERVICE_ROLE_KEY=$/m);
});

test("Coming Soon programs remain intentionally inactive", async () => {
  const source = await readFile(path.join(root, "app", "programs", "page.tsx"), "utf8");

  for (const program of ["Studies", "Mentoring", "Events"]) {
    assert.match(source, new RegExp(`title: "${program}"`));
  }
  assert.match(source, /const comingSoon =/);
});

test("prayer submission sends the request ID to the assignment notifier", async () => {
  const source = await readFile(
    path.join(root, "app", "prayer", "submit", "page.tsx"),
    "utf8"
  );

  assert.match(
    source,
    /fetch\("\/api\/notify-assignment"[\s\S]*JSON\.stringify\(\{\s*requestId:\s*newRequestId\s*\}\)/,
    "assignment notification must identify the saved prayer request"
  );
  assert.doesNotMatch(
    source,
    /JSON\.stringify\(\{[\s\S]*assigneeId:/,
    "the client must not send trusted assignment or prayer details"
  );
});

test("signed-in users can reach role-aware help manuals from the account menu", async () => {
  const menuSource = await readFile(
    path.join(root, "components", "AuthControls.tsx"),
    "utf8"
  );
  const helpSource = await readFile(path.join(root, "app", "help", "page.tsx"), "utf8");

  assert.match(menuSource, /href:\s*"\/help"/);
  assert.match(menuSource, /label:\s*"Help & User Manuals"/);
  assert.match(helpSource, /effectiveRole === "prayer_team"/);
  assert.match(helpSource, /effectiveRole === "pastor"/);
  assert.match(helpSource, /showAdminGuide=\{effectiveRole === "admin"\}/);
});
