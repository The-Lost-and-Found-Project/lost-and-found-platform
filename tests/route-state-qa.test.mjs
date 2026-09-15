import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const protectedPages = [
  ["app/account/page.tsx", "/login?next=%2Faccount"],
  ["app/help/page.tsx", "/login?next=%2Fhelp"],
  ["app/profile/page.tsx", "/login?next=%2Fprofile"],
  ["app/settings/page.tsx", "/login?next=%2Fsettings"],
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
