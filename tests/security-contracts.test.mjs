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

test("non-admin page requests leave the admin navigation area", async () => {
  const adminPages = [
    "page.tsx",
    "analytics/page.tsx",
    "applications/page.tsx",
    "content/page.tsx",
    "devotions/page.tsx",
    "feedback/page.tsx",
    "trivia/page.tsx",
    "users/page.tsx",
  ];

  for (const relativePath of adminPages) {
    const file = path.join(root, "app", "admin", relativePath);
    const source = await readFile(file, "utf8");
    assert.match(
      source,
      /if \((?:!isAdmin|effectiveRole !== "admin")\) \{\s*redirect\("\/dashboard"\);\s*\}/,
      `${file} must redirect ordinary members away from admin navigation`
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

test("new-member operational notifications are admin-only", async () => {
  const migrationSource = await readFile(
    path.join(
      root,
      "supabase",
      "migrations",
      "20260730163402_admin_only_member_notifications.sql"
    ),
    "utf8"
  );
  const buildInfoSource = await readFile(
    path.join(root, "app", "api", "build-info", "route.ts"),
    "utf8"
  );

  assert.match(migrationSource, /where prof\.role = 'admin'/);
  assert.doesNotMatch(
    migrationSource,
    /prof\.role in \('admin','pastor','prayer_team'\)/
  );
  assert.match(migrationSource, /n\.type = 'new_member'/);
  assert.match(migrationSource, /recipient\.role <> 'admin'/);
  assert.match(
    migrationSource,
    /to_regclass\('public\.notifications'\) is not null/
  );
  assert.match(migrationSource, /to_regclass\('public\.profiles'\) is not null/);
  assert.match(buildInfoSource, /VERCEL_GIT_COMMIT_SHA/);
  assert.doesNotMatch(buildInfoSource, /callerProfile/);
});

test("care-team notifications use the assignments-only destination", async () => {
  const migrationSource = await readFile(
    path.join(
      root,
      "supabase",
      "migrations",
      "20260730163629_role_appropriate_notification_links.sql"
    ),
    "utf8"
  );

  assert.match(migrationSource, /public\.notify_auto_assigned_care_team_member/);
  assert.match(migrationSource, /public\.notify_prayer_request_assigned/);
  assert.match(migrationSource, /public\.notify_prayer_care_application_decision/);
  assert.match(migrationSource, /'\/prayer-assignments'/);
  assert.match(
    migrationSource,
    /n\.type in \('assigned', 'prayer_care_application_approved'\)/
  );
  assert.match(migrationSource, /n\.title = 'New prayer request submitted'/);
  assert.match(
    migrationSource,
    /to_regclass\('public\.notifications'\) is not null/
  );
  assert.match(migrationSource, /to_regclass\('public\.profiles'\) is not null/);
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
  assert.doesNotMatch(
    source,
    /\.rpc\(\s*"get_prayer_request_assignment"/,
    "the browser must not call the protected assignment lookup function"
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

test("requester removal archives through an authenticated server route", async () => {
  const clientSource = await readFile(
    path.join(root, "components", "MyJourneyClient.tsx"),
    "utf8"
  );
  const routeSource = await readFile(
    path.join(root, "app", "api", "notify-request-removed", "route.ts"),
    "utf8"
  );

  assert.match(
    clientSource,
    /fetch\("\/api\/notify-request-removed"[\s\S]*JSON\.stringify\(\{\s*requestId\s*\}\)/
  );
  assert.doesNotMatch(
    clientSource,
    /\.from\("prayer_requests"\)[\s\S]*\.update\(\{\s*archived:\s*true\s*\}\)/
  );
  assert.match(routeSource, /auth\.getUser\(\)/);
  assert.match(routeSource, /prayerRequest\.user_id !== user\.id/);
  assert.match(routeSource, /\.update\(\{\s*archived:\s*true\s*\}\)/);
  assert.match(routeSource, /\.eq\("user_id", user\.id\)/);
});

test("linked praise reports can only answer the requester's own prayer", async () => {
  const clientSource = await readFile(
    path.join(root, "components", "PraiseSubmitClient.tsx"),
    "utf8"
  );
  const routeSource = await readFile(
    path.join(root, "app", "api", "praise-reports", "submit", "route.ts"),
    "utf8"
  );

  assert.match(clientSource, /fetch\("\/api\/praise-reports\/submit"/);
  assert.doesNotMatch(clientSource, /\.from\("prayer_requests"\)/);
  assert.match(routeSource, /auth\.getUser\(\)/);
  assert.match(
    routeSource,
    /\.from\("prayer_requests"\)[\s\S]*\.eq\("id", prayerRequestId\)[\s\S]*\.eq\("user_id", user\.id\)/
  );
  assert.match(routeSource, /\.update\(\{\s*answered:\s*true,\s*status:\s*"Resolved"\s*\}\)/);
});

test("prayer assignment updates are server-authorized and restricted to the assignee", async () => {
  const clientSource = await readFile(
    path.join(root, "components", "MyPrayerAssignmentsClient.tsx"),
    "utf8"
  );
  const routeSource = await readFile(
    path.join(root, "app", "api", "prayer-assignments", "update", "route.ts"),
    "utf8"
  );

  assert.match(routeSource, /\.eq\("assigned_to", user\.id\)/);
  assert.match(routeSource, /ALLOWED_FIELDS/);
  assert.match(routeSource, /\.eq\("archived", false\)/);
  assert.match(clientSource, /fetch\("\/api\/prayer-assignments\/update"/);
  assert.doesNotMatch(
    clientSource,
    /from\("prayer_requests"\)\.update\(changes\)/
  );
  assert.match(clientSource, /setRequests\(\(prev\) =>[\s\S]*previous/);
});
