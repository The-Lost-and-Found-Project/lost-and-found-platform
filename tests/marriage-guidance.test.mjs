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

test('all 21 days have a concrete shared exercise', () => {
 const exercises = readFileSync(new URL('../lib/marriage-daily-exercises.ts', import.meta.url), 'utf8');
 assert.equal((exercises.match(/^  \['/gm) ?? []).length, 21);
 assert.match(exercises, /newborn support plan/i);
 assert.match(exercises, /ministry response boundary/i);
 assert.match(exercises, /No one has to describe past trauma/);
 assert.match(page, /Today’s step-by-step exercise/);
});

test('every marriage lesson distinguishes passage context from pastoral application', () => {
 const notes = readFileSync(new URL('../lib/marriage-editorial-notes.ts', import.meta.url), 'utf8');
 assert.equal((notes.match(/^  [0-9]+: '/gm) ?? []).length, 21);
 assert.match(notes, /Mark 7:9–13/);
 assert.match(notes, /not a direct teaching/);
 assert.match(notes, /stop joint exercises/);
 assert.match(page, /Reading Scripture in context/);
});
