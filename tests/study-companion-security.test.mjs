import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

async function source(...parts) {
  return readFile(path.join(root, ...parts), "utf8");
}

test("Study Companion is protected by both session and owner checks", async () => {
  const middleware = await source("lib", "supabase", "middleware.ts");
  const access = await source("lib", "study-companion", "access.ts");
  const page = await source("app", "study-companion", "page.tsx");
  const action = await source("app", "study-companion", "actions.ts");

  assert.match(middleware, /"\/study-companion"/);
  assert.match(middleware, /searchParams\.set\(\s*"next"/);
  assert.match(access, /auth\.getUser\(\)/);
  assert.match(access, /membership\.role !== "owner"/);
  assert.match(access, /notFound\(\)/);
  assert.match(page, /getStudyCompanionFeatures\(\)/);
  assert.match(action, /requireStudyCompanionOwner\(\)/);
  assert.match(action, /\.eq\("role", role\)/);
  assert.match(action, /entitlement\?\.allowed/);
});

test("Study Companion keeps authorization and preferences separate", async () => {
  const migration = await source(
    "supabase",
    "migrations",
    "20260730175720_study_companion_access_foundation.sql"
  );

  for (const table of [
    "companion_memberships",
    "companion_features",
    "companion_role_features",
    "companion_user_preferences",
  ]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }

  assert.match(migration, /'owner', 'admin', 'beta', 'public'/);
  assert.match(migration, /role_name = 'owner'/);
  assert.match(migration, /check \(not default_enabled or allowed\)/);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /entitlement\.allowed/);
  assert.doesNotMatch(migration, /lostandfoundproject\.org/i);
  assert.doesNotMatch(migration, /service_role_key/i);
});

test("every major Study Companion module has an independent user switch", async () => {
  const migration = await source(
    "supabase",
    "migrations",
    "20260730175720_study_companion_access_foundation.sql"
  );
  const dashboard = await source("components", "StudyCompanionDashboard.tsx");

  for (const feature of [
    "chat",
    "guided_study",
    "scripture_explorer",
    "reflection_journal",
    "prayer_prompts",
  ]) {
    assert.match(migration, new RegExp(`'${feature}'`));
  }

  assert.match(dashboard, /role="switch"/);
  assert.match(dashboard, /features\.map/);
  assert.match(dashboard, /updateCompanionFeaturePreference/);
});

test("the alpha chat is a placeholder with no client-side AI credentials", async () => {
  const dashboard = await source("components", "StudyCompanionDashboard.tsx");
  const action = await source("app", "study-companion", "actions.ts");

  assert.match(dashboard, /Text interface placeholder/);
  assert.match(dashboard, /AI connection comes after the security foundation/);
  assert.doesNotMatch(dashboard, /OPENAI_API_KEY|dangerouslySetInnerHTML|fetch\(/);
  assert.doesNotMatch(action, /OPENAI_API_KEY|createAdminClient|service.role/i);
});
