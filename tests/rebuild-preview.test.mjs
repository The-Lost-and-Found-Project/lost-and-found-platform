import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { filterPreviewEvents, previewEvents } from "../lib/rebuild-preview.ts";

test("personal calendar scope remains in effect when Shared is selected", () => {
  const rows = filterPreviewEvents(previewEvents, "Personal calendar", "Shared", "All ministries");
  assert.deepEqual(rows.map((row) => row.id), ["sample-prayer"]);
});

test("assignment and ministry filters combine instead of broadening the result", () => {
  assert.deepEqual(filterPreviewEvents(previewEvents, "Master calendar", "Assigned", "Prayer"), []);
  assert.deepEqual(filterPreviewEvents(previewEvents, "Master calendar", "Assigned", "Studies").map((row) => row.id), ["sample-study"]);
});

test("clearing filters restores the fixture without mutating source events", () => {
  const before = JSON.stringify(previewEvents);
  filterPreviewEvents(previewEvents, "Master calendar", "Shared", "Outreach");
  assert.equal(JSON.stringify(previewEvents), before);
  assert.equal(filterPreviewEvents(previewEvents, "Master calendar", "All", "All ministries").length, 3);
});

test("preview entry is public, noindex, and renders only the sample design", () => {
  const route = readFileSync(new URL("../app/rebuild-preview/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(route, /requireAppCapability|createClient|fetch\s*\(/);
  assert.match(route, /return <RebuildPreview\s*\/>/);
  assert.match(route, /index: false, follow: false/);
});

test("prototype client has no production writes or storage side effects", () => {
  const client = readFileSync(new URL("../components/rebuild/RebuildPreview.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(client, /\bfetch\s*\(|localStorage|sessionStorage|use server|createClient/);
});
