import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getUnlockedDailyPathDay } from "../lib/daily-path-unlock.ts";

const release = "2026-11-10T15:00:00.000Z";
const at = Date.parse(release);

test("Daily Path stays invisible before release, including the instant before", () => {
  assert.equal(getUnlockedDailyPathDay(null, 7, at), 0);
  assert.equal(getUnlockedDailyPathDay("", 7, at), 0);
  assert.equal(getUnlockedDailyPathDay("invalid-date", 7, at), 0);
  assert.equal(getUnlockedDailyPathDay(release, 7, at - 1), 0);
  assert.equal(getUnlockedDailyPathDay(release, 7, Number.NaN), 0);
});

test("Day 1 opens exactly at release time; later days unlock at elapsed 24-hour intervals", () => {
  assert.equal(getUnlockedDailyPathDay(release, 7, at), 1);
  assert.equal(getUnlockedDailyPathDay(release, 7, at + 86_400_000 - 1), 1);
  assert.equal(getUnlockedDailyPathDay(release, 7, at + 86_400_000), 2);
  assert.equal(getUnlockedDailyPathDay(release, 7, at + 6 * 86_400_000), 7);
  assert.equal(getUnlockedDailyPathDay(release, 7, at + 99 * 86_400_000), 7);
});

test("Invalid card counts and day numbers cannot open content past the DB limit", () => {
  assert.equal(getUnlockedDailyPathDay(release, 0, at), 0);
  assert.equal(getUnlockedDailyPathDay(release, -1, at), 0);
  assert.equal(getUnlockedDailyPathDay(release, 1.5, at), 0);
  assert.equal(getUnlockedDailyPathDay(release, 200, at + 99 * 86_400_000), 31);
});

test("The member-facing page and all server actions use the same fail-closed release calculation", () => {
  const page = readFileSync("app/study-path/[sessionId]/[day]/page.tsx", "utf8");
  const actions = readFileSync("app/study-path/[sessionId]/[day]/actions.ts", "utf8");
  assert.match(page, /getUnlockedDailyPathDay\(session\.daily_path_released_at,cards\.length\)/);
  assert.match(page, /if\(unlockDay===0\)redirect\("\/dashboard"\)/);
  assert.match(actions, /getUnlockedDailyPathDay\(session\.daily_path_released_at,cards\.length\)/);
  assert.match(actions, /if\(unlocked===0\|\|day>unlocked\)throw/);
  assert.doesNotMatch(page, /Math\.max\(1,Math\.floor/);
});
