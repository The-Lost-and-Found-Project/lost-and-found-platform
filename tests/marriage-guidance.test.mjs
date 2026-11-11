import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const guidance = readFileSync(new URL('../lib/marriage-journey-guidance.ts', import.meta.url), 'utf8');
const page = readFileSync(new URL('../app/marriage-journey/[session]/page.tsx', import.meta.url), 'utf8');
test('all 21 marriage sessions have separate biblical teaching and application', () => {
  const sections = guidance.match(/^  \["/gm) ?? [];
  assert.equal(sections.length, 21);
  assert.match(page, /Understanding the passage/);
  assert.match(page, /Bring it home/);
  assert.match(page, /Heart question/);
});
test('trauma and spiritual abuse are not normalized by marriage content', () => {
  assert.match(guidance, /coercion/);
  assert.match(guidance, /intimidation/);
  assert.match(guidance, /qualified support/);
  assert.match(guidance, /Ministry must not become a loophole for neglect/);
});
