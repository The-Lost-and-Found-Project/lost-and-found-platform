import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const guidance = readFileSync(new URL('../lib/marriage-journey-guidance.ts', import.meta.url), 'utf8');
const page = readFileSync(new URL('../app/marriage-journey/[session]/page.tsx', import.meta.url), 'utf8');
test('all 21 marriage sessions have separate biblical teaching and application', () => {
  const sections = guidance.match(/^  \["/gm) ?? [];
  assert.equal(sections.length, 21);
  assert.match(page, /Understanding Scripture in its setting/);
  assert.match(page, /Put the teaching into practice/);
  assert.match(page, /Talk it through together/);
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
 assert.match(page, /marriageDailyExercises\[number - 1\]\[1\]/);
});

test('every marriage lesson distinguishes passage context from pastoral application', () => {
 const notes = readFileSync(new URL('../lib/marriage-editorial-notes.ts', import.meta.url), 'utf8');
 assert.equal((notes.match(/^  [0-9]+: '/gm) ?? []).length, 21);
 assert.match(notes, /Mark 7:9–13/);
 assert.match(notes, /not a direct teaching/);
 assert.match(notes, /stop joint exercises/);
 assert.match(page, /Understanding Scripture in its setting/);
});

test('weekly pastoral meetings have preparation and an agenda for each checkpoint', () => {
 const meetings = readFileSync(new URL('../lib/marriage-weekly-meetings.ts', import.meta.url), 'utf8');
 assert.equal((meetings.match(/^  (7|14|21): \{/gm) ?? []).length, 3);
 assert.match(meetings, /Individual journal entries and trauma histories are not required/);
 assert.match(page, /Prepare together for your weekly meeting/);
});

test('expanded lessons offer contextual teaching, discussion, and prayer', () => {
 const deep = readFileSync(new URL('../lib/marriage-deep-lessons.ts', import.meta.url), 'utf8');
 assert.equal((deep.match(/^  (?:[1-9]|1[0-9]|2[01]): \{/gm) ?? []).length, 21);
 assert.match(deep, /James 1:19–20/);
 assert.match(deep, /prayer:/);
 assert.match(page, /Expanded Scripture teaching/);
});
