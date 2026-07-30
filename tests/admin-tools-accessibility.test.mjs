import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("remaining admin tools expose labels, state, and touch targets", async () => {
  const [analytics, feedback, devotions, trivia] = await Promise.all([
    readFile(path.join(root, "components", "AdminAnalyticsClient.tsx"), "utf8"),
    readFile(path.join(root, "components", "AdminFeedbackClient.tsx"), "utf8"),
    readFile(path.join(root, "components", "AdminDevotionsClient.tsx"), "utf8"),
    readFile(path.join(root, "components", "AdminTriviaClient.tsx"), "utf8"),
  ]);

  assert.match(analytics, /aria-label="Chart range"/);
  assert.match(analytics, /aria-pressed=\{range === opt\.key\}/);

  assert.match(feedback, /htmlFor="feedback-status-filter"/);
  assert.match(feedback, /id="feedback-status-filter"/);
  assert.match(feedback, /aria-label=\{`Archive feedback from /);

  assert.match(devotions, /aria-expanded=\{isOpen\}/);
  assert.match(devotions, /aria-controls=\{`devotion-week-\$\{week\.id\}`\}/);
  assert.match(devotions, /htmlFor=\{`week-title-\$\{week\.id\}`\}/);
  assert.match(devotions, /role="alert"\s+aria-live="assertive"/);

  for (const id of [
    "trivia-category-name",
    "trivia-category-order",
    "trivia-category-description",
    "trivia-question-category",
    "trivia-question-text",
    "trivia-scripture-reference",
    "trivia-explanatory-note",
  ]) {
    assert.match(trivia, new RegExp(`htmlFor="${id}"`));
    assert.match(trivia, new RegExp(`id="${id}"`));
  }
  assert.match(trivia, /aria-label="Filter questions by category"/);
  assert.match(trivia, /role="alert"\s+aria-live="assertive"/);

  for (const source of [analytics, feedback, devotions, trivia]) {
    assert.match(source, /min-h-11/);
  }
});
