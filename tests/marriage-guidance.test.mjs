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

test('daily couple study and weekly mentor meetings have distinct roles', () => {
 const rhythm = readFileSync(new URL('../lib/marriage-couple-rhythm.ts', import.meta.url), 'utf8');
 assert.match(rhythm, /Read Scripture aloud/);
 assert.match(rhythm, /Listen and discuss/);
 assert.match(rhythm, /Practice together/);
 assert.match(rhythm, /Pray with one another/);
 assert.match(rhythm, /Record your own reflection/);
 assert.match(rhythm, /After every seven daily sessions/);
 assert.match(page, /Your time together today/);
});
