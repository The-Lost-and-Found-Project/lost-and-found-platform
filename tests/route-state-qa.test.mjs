import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");


const protectedAdminPages = [
  ["app/admin/page.tsx", "/login?next=%2Fadmin"],
  ["app/admin/users/page.tsx", "/login?next=%2Fadmin%2Fusers"],
  ["app/admin/content/page.tsx", "/login?next=%2Fadmin%2Fcontent"],
  ["app/admin/feedback/page.tsx", "/login?next=%2Fadmin%2Ffeedback"],
  ["app/admin/analytics/page.tsx", "/login?next=%2Fadmin%2Fanalytics"],
  ["app/admin/live/page.tsx", "/login?next=%2Fadmin%2Flive"],
  ["app/admin/library/page.tsx", "/login?next=%2Fadmin%2Flibrary"],
  ["app/admin/creator/page.tsx", "/login?next=%2Fadmin%2Fcreator"],
  ["app/admin/notifications/page.tsx", "/login?next=%2Fadmin%2Fnotifications"],
  ["app/admin/ministries/page.tsx", "/login?next=%2Fadmin%2Fministries"],
  ["app/admin/studies/page.tsx", "/login?next=%2Fadmin%2Fstudies"],
];

const protectedPages = [
  ["app/account/page.tsx", "/login?next=%2Faccount"],
  ["app/help/page.tsx", "/login?next=%2Fhelp"],
  ["app/profile/page.tsx", "/login?next=%2Fprofile"],
  ["app/settings/page.tsx", "/login?next=%2Fsettings"],
  ["app/learn/page.tsx", "/login?next=%2Flearn"],
  ["app/trivia/page.tsx", "/login?next=%2Ftrivia"],
  ["app/support/page.tsx", "/login?next=%2Fsupport"],
  ["app/help/manual/member/page.tsx", "/login?next=%2Fhelp%2Fmanual%2Fmember"],
];

test("core account routes preserve the requested destination through authentication", async () => {
  for (const [path, destination] of protectedPages) {
    const source = await read(path);
    assert.match(source, new RegExp(`redirect\\(\\"${destination.replace(/[?]/g, "\\?")}\\"\\)`));
  }
});

test("core account routes do not collapse unauthenticated members onto a generic login destination", async () => {
  for (const [path] of protectedPages) {
    const source = await read(path);
    assert.doesNotMatch(source, /redirect\("\/login"\)/);
  }
});


test("admin and facilitator workspaces preserve their destination through authentication", async () => {
  for (const [path, destination] of protectedAdminPages) {
    const source = await read(path);
    assert.match(source, new RegExp(`redirect\\(\\"${destination.replace(/[?]/g, "\\?")}\\"\\)`));
    assert.doesNotMatch(source, /redirect\("\/login"\)/);
  }
});
