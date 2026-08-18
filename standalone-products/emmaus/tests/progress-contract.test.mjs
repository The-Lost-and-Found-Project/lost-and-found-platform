import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("John 1 progress uses the current Emmaus progress schema", async () => {
  const component = await source("components/JohnOneDiscovery.tsx");

  for (const field of [
    "emmaus_discovery_progress",
    "user_id",
    "pack_id",
    "discovery_id",
    "current_step",
    "responses",
    "revealed_clues",
    "is_completed",
    "completed_at",
    'onConflict: "user_id,pack_id,discovery_id"',
  ]) {
    assert.match(component, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  for (const legacyField of ["active_step", "observation", "thread_opened"]) {
    assert.doesNotMatch(component, new RegExp(legacyField));
  }
});

test("study and discovery routes require a Supabase user", async () => {
  const study = await source("app/study/page.tsx");
  const discovery = await source("app/study/discover/john-1/page.tsx");

  for (const route of [study, discovery]) {
    assert.match(route, /supabase\.auth\.getUser\(\)/);
    assert.match(route, /if \(!user\)/);
    assert.match(route, /redirect\("\/login\?next=/);
  }
});

test("standalone public environment file contains no privileged secret", async () => {
  const env = await source(".env.example");
  assert.match(env, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(env, /NEXT_PUBLIC_SUPABASE_ANON_KEY=/);
  assert.doesNotMatch(env, /SERVICE_ROLE/i);
  assert.doesNotMatch(env, /SECRET_KEY/i);
  assert.doesNotMatch(env, /RESEND_API_KEY/);
  assert.doesNotMatch(env, /OPENAI_API_KEY/);
});
