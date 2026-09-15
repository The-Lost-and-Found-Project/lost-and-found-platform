import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

test("dynamic member deep links preserve their destination through login", () => {
  const library = read("app/library/[slug]/page.tsx");
  const ministry = read("app/ministries/[slug]/page.tsx");
  assert.match(library, /login\?next=.*library/);
  assert.match(ministry, /login\?next=.*ministries/);
  assert.match(library, /encodeURIComponent/);
  assert.match(ministry, /encodeURIComponent/);
});

test("Platform 2.0 supplies recoverable global route states", () => {
  const notFound = read("app/not-found.tsx");
  const loading = read("app/loading.tsx");
  const error = read("app/error.tsx");
  assert.match(notFound, /Go to Discover/);
  assert.match(notFound, /Go to Home/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(error, /reset/);
  assert.match(error, /Try again/);
  assert.match(error, /Go to Home/);
});

test("legacy Programs and Apps routes remain intentional Discover redirects", () => {
  assert.match(read("app/programs/page.tsx"), /redirect\("\/discover"\)/);
  assert.match(read("app/apps/page.tsx"), /redirect\("\/discover"\)/);
});
