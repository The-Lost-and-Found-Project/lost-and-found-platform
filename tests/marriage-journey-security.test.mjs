import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const migration = read('supabase/migrations/20261111182457_marriage_journey_private_progress.sql');
const action = read('app/marriage-journey/[session]/actions.ts');
const sessionPage = read('app/marriage-journey/[session]/page.tsx');
const overview = read('app/marriage-journey/page.tsx');
const content = read('lib/marriage-journey.ts');

test('marriage progress is RLS-protected and scoped to auth user for every operation', () => {
  assert.match(migration, /enable row level security/i);
  for (const operation of ['select','insert','update','delete']) assert.match(migration, new RegExp(`for ${operation} to authenticated`, 'i'));
  assert.equal((migration.match(/\(select auth\.uid\(\)\) = user_id/g) ?? []).length, 5);
  assert.doesNotMatch(migration, /using\s*\(\s*true\s*\)/i);
  assert.match(migration, /revoke all .* from anon/i);
});
test('server action requires authenticated user and derives ownership from auth', () => {
  assert.match(action, /requireMarriageAssignment\(/);
  assert.match(action, /user_id:\s*user\.id/);
  assert.doesNotMatch(action, /formData\.get\(["']user_id/);
  assert.match(action, /session < 1 \|\| session > 21/);
});
test('failed progress reads do not masquerade as a working private workbook', () => {
  assert.match(sessionPage, /progressError/);
  assert.match(sessionPage, /disabled=\{Boolean\(progressError\)\}/);
  assert.match(overview, /progressError/);
});
test('mentor access is not granted and all 21 lessons are defined', () => {
  assert.doesNotMatch(migration, /mentor.*for select/i);
  assert.match(content, /Choosing Each Other, Choosing Christ/);
  assert.match(content, /Listening Is an Act of Love/);
});
