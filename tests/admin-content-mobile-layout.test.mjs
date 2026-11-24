import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("components/AdminContentClient.tsx", "utf8");
assert.match(source, /flex-col gap-4 sm:flex-row/);
assert.match(source, /grid w-full grid-cols-2 gap-2 sm:flex/);
console.log("moderation card mobile layout: ok");
