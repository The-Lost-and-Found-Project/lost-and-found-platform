import assert from "node:assert/strict";
import fs from "node:fs";

const nav = fs.readFileSync("components/AdminSectionNav.tsx", "utf8");
const layout = fs.readFileSync("app/admin/layout.tsx", "utf8");
const command = fs.readFileSync("components/AdminCommandCenter.tsx", "utf8");

assert.doesNotMatch(nav, /overflow-x-auto/);
assert.match(layout, /lg:grid-cols-\[15rem_minmax\(0,1fr\)\]/);
assert.match(command, /Needs attention/);
assert.match(command, /Choose a place to work/);
assert.doesNotMatch(command, /rounded-\[2rem\]/);
console.log("admin control-center structure: ok");
